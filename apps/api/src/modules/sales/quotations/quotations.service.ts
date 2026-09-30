import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { compare } from 'bcrypt';

import type { NewSalesQuotationItem } from '@erp/db';

import { amountInWords } from '../proforma-invoices/pi-words';

import type {
  ListQuotationsQueryDto,
  QuotationItemDto,
  SaveQuotationDto,
} from './dto/quotation.dto';
import { QuotationsRepository } from './quotations.repository';

@Injectable()
export class QuotationsService {
  constructor(private readonly repository: QuotationsRepository) {}

  draft() {
    const today = this.kathmanduDate();
    const expiry = this.addDays(today, 30);
    const stamp = today.replaceAll('-', '');
    const suffix = randomBytes(2).toString('hex').toUpperCase();
    return {
      quotationNumber: `QT-${stamp}-${suffix}`,
      quotationDate: today,
      expiryDate: expiry,
      termsConditions: this.defaultTerms(expiry),
    };
  }

  async list(tenantId: string, query: ListQuotationsQueryDto) {
    const [items, metrics] = await Promise.all([
      this.repository.list(tenantId, query),
      this.repository.metrics(tenantId),
    ]);
    return { items, metrics };
  }

  async findDetails(tenantId: string, id: string) {
    const header = await this.repository.findHeader(tenantId, id);
    if (!header) throw new NotFoundException('Quotation not found.');
    const items = await this.repository.findItems(tenantId, id);
    const currency = header.currency === 'USD' ? 'USD' : 'NPR';
    return {
      ...header,
      currency,
      amountInWords: amountInWords(Number(header.totalAmount), currency),
      items,
    };
  }

  async create(tenantId: string, userId: string, dto: SaveQuotationDto) {
    const money = this.money(dto);
    try {
      const created = await this.repository.create(
        {
          tenantId,
          quotationNumber: dto.quotationNumber.trim(),
          customerId: dto.customerId ?? null,
          customerName: dto.customerName.trim(),
          leadId: dto.leadId ?? null,
          issueDate: dto.quotationDate,
          expiryDate: dto.expiryDate,
          destinationAddress: this.optional(dto.customerAddress),
          terms: this.optional(dto.termsConditions),
          currency: dto.currency,
          vatApplicable: money.vatApplicable,
          status: 'ACTIVE',
          subtotalAmount: money.subtotal,
          vatAmount: money.vat,
          totalAmount: money.total,
          createdBy: userId,
        },
        this.itemRows(tenantId, dto.items),
      );
      return this.findDetails(tenantId, created.id);
    } catch (error: unknown) {
      if (this.isUnique(error)) {
        throw new BadRequestException(
          'That quotation number was just used. Reload the page and save again.',
        );
      }
      throw new BadRequestException('The quotation could not be saved.');
    }
  }

  async update(tenantId: string, id: string, dto: SaveQuotationDto) {
    const money = this.money(dto);
    const updated = await this.repository.update(
      tenantId,
      id,
      {
        customerId: dto.customerId ?? null,
        customerName: dto.customerName.trim(),
        leadId: dto.leadId ?? null,
        issueDate: dto.quotationDate,
        expiryDate: dto.expiryDate,
        destinationAddress: this.optional(dto.customerAddress),
        terms: this.optional(dto.termsConditions),
        currency: dto.currency,
        vatApplicable: money.vatApplicable,
        subtotalAmount: money.subtotal,
        vatAmount: money.vat,
        totalAmount: money.total,
      },
      this.itemRows(tenantId, dto.items, id),
    );
    if (!updated) throw new NotFoundException('Quotation not found.');
    return this.findDetails(tenantId, id);
  }

  async purge(tenantId: string, userId: string, id: string, password: string) {
    if (!password.trim()) {
      throw new BadRequestException(
        'Administrative clearance failure: Security code authorization mismatch.',
      );
    }
    const actor = await this.repository.findActor(tenantId, userId);
    const matches =
      Boolean(actor?.passwordHash) &&
      (await compare(password, actor?.passwordHash ?? '').catch(() => false));
    if (!matches) {
      throw new BadRequestException(
        'Administrative clearance failure: Security code authorization mismatch.',
      );
    }
    const removed = await this.repository.purge(tenantId, id);
    if (!removed) throw new NotFoundException('Quotation not found.');
    return {
      success: true,
      message:
        'Target proposal entry and related child arrays dropped permanently from records.',
    };
  }

  private money(dto: SaveQuotationDto) {
    const subtotal = dto.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );
    const vatApplicable = dto.currency === 'USD' ? 0 : dto.vatApplicable === false ? 0 : 1;
    const vat = vatApplicable ? Math.round(subtotal * 0.13 * 100) / 100 : 0;
    const total = Math.round((subtotal + vat) * 100) / 100;
    return {
      vatApplicable,
      subtotal: subtotal.toFixed(2),
      vat: vat.toFixed(2),
      total: total.toFixed(2),
    };
  }

  private itemRows(
    tenantId: string,
    items: QuotationItemDto[],
    quotationId = '00000000-0000-0000-0000-000000000000',
  ): NewSalesQuotationItem[] {
    return items
      .filter((item) => item.itemName.trim())
      .map((item, index) => ({
        tenantId,
        quotationId,
        itemName: item.itemName.trim(),
        description: item.description?.trim() || null,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toFixed(2),
        lineTotal: (item.quantity * item.unitPrice).toFixed(2),
        sortOrder: index,
      }));
  }

  private defaultTerms(expiry: string): string {
    return `• Delivery: 4-5 weeks from PO date\n• 100% Advance Payment.\n• Quotation Validity: ${expiry}`;
  }

  private kathmanduDate(date = new Date()): string {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kathmandu',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  }

  private addDays(isoDate: string, days: number): string {
    const date = new Date(`${isoDate}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
  }

  private optional(value: string | undefined): string | null {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
  }

  private isUnique(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === '23505'
    );
  }
}
