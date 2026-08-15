import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { constants } from 'node:fs';
import { access } from 'node:fs/promises';
import { join } from 'node:path';

import type {
  NewOperationsPurchaseOrder,
  NewOperationsPurchaseOrderItem,
} from '@erp/db';

import { createPaginatedResult } from '../../../common/pagination';
import {
  CreatePurchaseOrderDto,
  ListPurchaseOrdersQueryDto,
} from './dto/purchase-order.dto';
import { PurchaseOrdersRepository } from './purchase-orders.repository';
import { CompanyService } from '../../company/company.service';
import { SmtpService } from '../../smtp/smtp.service';

@Injectable()
export class PurchaseOrdersService {
  constructor(
    private readonly repository: PurchaseOrdersRepository,
    private readonly companyService: CompanyService,
    private readonly smtp: SmtpService,
  ) {}

  async list(tenantId: string, query: ListPurchaseOrdersQueryDto) {
    const result = await this.repository.list({ tenantId, ...query });
    return createPaginatedResult(
      result.data.map((order) => ({
        ...order,
        totalAmount: Number(order.totalAmount),
      })),
      query.page,
      query.limit,
      result.total,
    );
  }

  async findDetails(tenantId: string, id: string) {
    const order = await this.repository.findDetails(tenantId, id);
    if (!order) throw new NotFoundException('Purchase order not found');
    return {
      ...order,
      totalAmount: Number(order.totalAmount),
      items: order.items.map((item) => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        lineTotal: Number(item.lineTotal),
      })),
    };
  }

  async nextNumber(tenantId: string, date: string) {
    return { poNumber: await this.generateNumber(tenantId, date) };
  }

  async create(
    tenantId: string,
    actorUserId: string,
    dto: CreatePurchaseOrderDto,
  ) {
    const vendor = await this.repository.findVendor(tenantId, dto.vendorId);
    if (!vendor) throw new NotFoundException('Active vendor not found');

    const requestedProductIds = dto.items.map((item) => item.productId);
    if (new Set(requestedProductIds).size !== requestedProductIds.length) {
      throw new ConflictException(
        'Each product can appear only once in a purchase order',
      );
    }
    const products = await this.repository.findProducts(
      tenantId,
      requestedProductIds,
    );
    if (products.length !== requestedProductIds.length) {
      throw new NotFoundException(
        'One or more products were not found in this company',
      );
    }
    const productById = new Map(
      products.map((product) => [product.id, product]),
    );
    const now = new Date();
    const purchaseOrderId = randomUUID();
    let total = 0;
    const poNumber = await this.generateNumber(tenantId, dto.poDate);
    const order: NewOperationsPurchaseOrder = {
      id: purchaseOrderId,
      tenantId,
      poNumber,
      vendorId: vendor.id,
      poDate: dto.poDate,
      attentionContact: this.optional(dto.attentionContact),
      deliveryAddress: this.optional(dto.deliveryAddress),
      paymentTerms:
        this.optional(dto.paymentTerms) ??
        this.paymentTerms(vendor.paymentTermsDays),
      notes: this.optional(dto.notes),
      status: 'ISSUED',
      totalAmount: '0.00',
      createdBy: actorUserId,
      updatedBy: actorUserId,
      createdAt: now,
      updatedAt: now,
    };
    const items: NewOperationsPurchaseOrderItem[] = dto.items.map(
      (input, index) => {
        const product = productById.get(input.productId);
        if (!product || !product.isActive) {
          throw new ConflictException(
            'All purchase-order products must be active',
          );
        }
        const lineTotal = input.quantity * input.unitPrice;
        total += lineTotal;
        return {
          tenantId,
          purchaseOrderId,
          productId: product.id,
          productName: product.name,
          description: this.optional(input.description) ?? product.description,
          unitSymbol: product.unitSymbol,
          quantity: input.quantity,
          unitPrice: input.unitPrice.toFixed(2),
          lineTotal: lineTotal.toFixed(2),
          receivedQuantity: 0,
          sortOrder: index,
        };
      },
    );
    order.totalAmount = total.toFixed(2);

    try {
      const created = await this.repository.create(order, items);
      return this.findDetails(tenantId, created.id);
    } catch (error: unknown) {
      if (this.databaseErrorCode(error) === '23505') {
        throw new ConflictException(
          'Purchase order number already exists. Try saving again.',
        );
      }
      throw error;
    }
  }

  async sendEmail(tenantId: string, id: string) {
    const [order, company] = await Promise.all([
      this.findDetails(tenantId, id),
      this.companyService.findCurrent(tenantId),
    ]);
    if (!order.vendorEmail) {
      throw new BadRequestException(
        'This vendor has no email address. Add one before sending the purchase order.',
      );
    }

    const logoAttachment = await this.logoAttachment(company);

    await this.smtp.send(tenantId, {
      to: order.vendorEmail,
      subject: `Purchase Order ${order.poNumber} — ${company.legalName ?? company.name}`,
      text: this.purchaseOrderText(company, order),
      html: this.purchaseOrderHtml(company, order, logoAttachment?.cid),
      attachments: logoAttachment ? [logoAttachment] : undefined,
    });

    return {
      success: true,
      message: `Purchase order was emailed to ${order.vendorEmail}.`,
    };
  }

  private async generateNumber(
    tenantId: string,
    date: string,
  ): Promise<string> {
    const year = Number(date.slice(0, 4));
    const latest = await this.repository.latestNumber(tenantId, year);
    const suffix = latest ? Number(latest.split('-').at(-1)) : 0;
    return `PO-${year}-${String((Number.isFinite(suffix) ? suffix : 0) + 1).padStart(4, '0')}`;
  }

  private paymentTerms(days: number): string | undefined {
    return days > 0 ? `Net ${days} days` : undefined;
  }

  private optional(value: string | null | undefined): string | undefined {
    const normalized = value?.trim();
    return normalized || undefined;
  }

  private databaseErrorCode(error: unknown): string | undefined {
    if (typeof error !== 'object' || error === null) return undefined;
    const record = error as { code?: unknown; cause?: { code?: unknown } };
    if (typeof record.code === 'string') return record.code;
    return typeof record.cause?.code === 'string'
      ? record.cause.code
      : undefined;
  }

  private purchaseOrderText(
    company: {
      legalName: string | null;
      name: string;
      addressLine1: string | null;
      city: string | null;
      country: string | null;
      phone: string | null;
      email: string | null;
      taxNumber: string | null;
      logoUrl: string | null;
      invoiceLogoUrl: string | null;
    },
    order: Awaited<ReturnType<PurchaseOrdersService['findDetails']>>,
  ): string {
    const lines = order.items
      .map(
        (item) =>
          `${item.productName} | ${item.quantity} ${item.unitSymbol} × ${this.currency(item.unitPrice)} = ${this.currency(item.lineTotal)}`,
      )
      .join('\n');
    return `${company.legalName ?? company.name}\n${[company.addressLine1, company.city, company.country].filter(Boolean).join(', ')}\n\nPURCHASE ORDER ${order.poNumber}\nDate: ${order.poDate}\nVendor: ${order.vendorName}\nAttention: ${order.attentionContact ?? '—'}\n\n${lines}\n\nGRAND TOTAL (EXCL. VAT): ${this.currency(order.totalAmount)}\n\nTerms & Conditions\n1. Goods must be delivered within 7 business days from PO authorization.\n2. Payment terms: Net 30 days upon receiving verified item invoice.\n3. Defective entries must be replaced immediately at vendor expense.`;
  }

  private purchaseOrderHtml(
    company: {
      legalName: string | null;
      name: string;
      addressLine1: string | null;
      city: string | null;
      country: string | null;
      phone: string | null;
      email: string | null;
      taxNumber: string | null;
      logoUrl: string | null;
      invoiceLogoUrl: string | null;
    },
    order: Awaited<ReturnType<PurchaseOrdersService['findDetails']>>,
    logoCid?: string,
  ): string {
    const companyName = this.escape(company.legalName ?? company.name);
    const address = this.escape(
      [company.addressLine1, company.city, company.country]
        .filter(Boolean)
        .join(', '),
    );
    const rows = order.items
      .map(
        (item) =>
          `<tr><td>${this.escape(item.productName)}</td><td>${this.escape(item.description ?? '')}</td><td style="text-align:right">${item.quantity} ${this.escape(item.unitSymbol)}</td><td style="text-align:right">${this.currency(item.unitPrice)}</td><td style="text-align:right">${this.currency(item.lineTotal)}</td></tr>`,
      )
      .join('');
    const logo = logoCid
      ? `<img src="cid:${logoCid}" alt="${companyName} logo" style="display:block;max-width:250px;max-height:92px;width:auto;height:auto;margin-bottom:12px">`
      : '';
    return `<!doctype html><html><body style="margin:0;background:#f1f5f9;font-family:Arial,sans-serif;color:#0f172a"><main style="box-sizing:border-box;width:100%;max-width:820px;margin:24px auto;background:#fff;padding:52px 58px;border:1px solid #1e293b"><header style="border-bottom:1px solid #cbd5e1;padding-bottom:24px"><table role="presentation" width="100%"><tr><td>${logo}<div style="font-size:25px;font-weight:700;color:#0f172a">${companyName}</div><div style="margin-top:8px;font-size:13px;line-height:1.55;color:#475569">${address}${company.phone ? `<br>Contact: ${this.escape(company.phone)}` : ''}${company.email ? `<br>Email: ${this.escape(company.email)}` : ''}${company.taxNumber ? `<br><strong>VAT / PAN NO:</strong> ${this.escape(company.taxNumber)}` : ''}</div></td><td style="text-align:right;vertical-align:top"><div style="font-size:30px;font-weight:800;color:#2563eb;letter-spacing:1px">PURCHASE ORDER</div><div style="margin-top:20px;font-weight:700">PO DATE: ${this.escape(order.poDate)}</div><div style="margin-top:10px;font-size:19px;font-weight:800">${this.escape(order.poNumber)}</div></td></tr></table></header><section style="padding:24px 0"><table role="presentation" width="100%"><tr><td width="50%" style="vertical-align:top"><div style="font-size:12px;font-weight:700">VENDOR / SUPPLIER COMPANY</div><div style="margin-top:6px;font-size:14px;font-weight:700">${this.escape(order.vendorName)}</div></td><td style="vertical-align:top;border-left:1px solid #cbd5e1;padding-left:24px"><div style="font-size:12px;font-weight:700">TO (ATTENTION PERSON / VENDOR REPRESENTATIVE)</div><div style="margin-top:6px;font-size:14px;font-weight:700">${this.escape(order.attentionContact ?? '—')}</div></td></tr></table></section><h2 style="font-size:18px;margin:18px 0 12px">Line Item Cost Specification Ledger</h2><table width="100%" cellspacing="0" cellpadding="10" style="border-collapse:collapse;font-size:12px"><thead><tr style="background:#f8fafc"><th style="border:1px solid #cbd5e1;text-align:left">ITEM / PRODUCT NAME</th><th style="border:1px solid #cbd5e1;text-align:left">DESCRIPTION / SPECIFICATION</th><th style="border:1px solid #cbd5e1;text-align:right">UNITS / QUANTITY</th><th style="border:1px solid #cbd5e1;text-align:right">UNIT PRICE (EXCL. VAT)</th><th style="border:1px solid #cbd5e1;text-align:right">SUB TOTAL (Rs.)</th></tr></thead><tbody>${rows}</tbody></table><div style="margin-top:16px;text-align:right;font-size:14px;font-weight:700">GRAND TOTAL (EXCL. VAT): <span style="margin-left:24px;color:#2563eb;font-size:18px">${this.currency(order.totalAmount)}</span></div><section style="margin-top:34px;font-size:12px;line-height:1.5"><strong>TERMS &amp; CONDITIONS</strong><ol style="margin:8px 0;padding-left:18px"><li>Goods must be delivered within 7 business days from PO authorization.</li><li>Payment terms: Net 30 days upon receiving verified item invoice.</li><li>Defective entries must be replaced immediately at vendor expense.</li></ol></section><footer style="margin-top:86px;margin-left:auto;width:230px;border-top:1px solid #334155;padding-top:9px;text-align:center;font-size:12px"><strong>Authorized Officer</strong><br><span style="font-size:10px;color:#475569">OPERATIONS DEPARTMENT<br>AUTHORIZED SIGNATORY</span></footer></main></body></html>`;
  }

  private async logoAttachment(company: {
    logoUrl: string | null;
    invoiceLogoUrl: string | null;
  }): Promise<{ filename: string; path: string; cid: string } | undefined> {
    const logoUrl = company.invoiceLogoUrl ?? company.logoUrl;
    const normalizedPath = logoUrl
      ?.replace(/^https?:\/\/[^/]+/i, '')
      .replace(/^\/uploads\//, '');
    if (!normalizedPath || normalizedPath.includes('..')) return undefined;

    const path = join(process.cwd(), 'uploads', normalizedPath);
    try {
      await access(path, constants.R_OK);
      return {
        filename: normalizedPath.split('/').at(-1) ?? 'company-logo',
        path,
        cid: 'company-logo',
      };
    } catch {
      return undefined;
    }
  }

  private currency(value: number): string {
    return `Rs. ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  private escape(value: string): string {
    return value.replace(
      /[&<>'"]/g,
      (character) =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          "'": '&#39;',
          '"': '&quot;',
        })[character] ?? character,
    );
  }
}
