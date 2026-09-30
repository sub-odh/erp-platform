import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';

import type { NewSalesCloudQuotationItem } from '@erp/db';

import { PHP_ROLE_1 } from '../../auth/role-access';
import type {
  CloudQuotationItemDto,
  SaveCloudQuotationDto,
} from './dto/cloud-quotation.dto';
import { CloudQuotationsRepository } from './cloud-quotations.repository';

const DEFAULT_TERMS = `1. Delivery: 1-3 Business Days post-PO authorization.
2. Payment Terms: 100% Advance Payment for Recurring Subscriptions.
3. SLA Benchmark: 99.9% Uptime Guarantee on Infrastructure Services.`;

@Injectable()
export class CloudQuotationsService {
  constructor(private readonly repository: CloudQuotationsRepository) {}

  draft() {
    const today = this.kathmanduDate();
    const stamp = today.replaceAll('-', '');
    const suffix = randomBytes(2).toString('hex').toUpperCase();
    return {
      quotationNumber: `QT-${stamp}-${suffix}`,
      quotationDate: today,
      expiryDate: this.addDays(today, 30),
      termsConditions: DEFAULT_TERMS,
    };
  }

  list(tenantId: string) {
    return this.repository.list(tenantId);
  }

  async findDetails(tenantId: string, id: string) {
    const header = await this.repository.findHeader(tenantId, id);
    if (!header) throw new NotFoundException('Quotation record not found.');
    const items = await this.repository.findItems(tenantId, id);
    return {
      id: header.id,
      quotationNumber: header.quotationNumber,
      quotationDate: header.issueDate,
      expiryDate: header.expiryDate,
      customerName: header.customerName,
      customerAddress: header.customerAddress ?? '',
      currency: header.currency === 'USD' ? 'USD' : 'NPR',
      vatApplicable: header.vatApplicable,
      subtotalAmount: header.subtotalAmount,
      discountAmount: header.discountAmount,
      vatAmount: header.vatAmount,
      totalAmount: header.totalAmount,
      termsConditions: header.terms ?? '',
      items,
    };
  }

  async create(tenantId: string, userId: string, dto: SaveCloudQuotationDto) {
    const money = this.money(dto);
    const items = this.itemRows(tenantId, dto.items);
    if (!dto.customerName.trim() || !dto.quotationNumber.trim() || !dto.quotationDate || items.length === 0) {
      throw new BadRequestException(
        'All header fields and at least one service item line are required.',
      );
    }
    try {
      const created = await this.repository.create(
        {
          tenantId,
          quotationNumber: dto.quotationNumber.trim(),
          customerName: dto.customerName.trim(),
          customerAddress: dto.customerAddress?.trim() || null,
          issueDate: dto.quotationDate,
          expiryDate: dto.expiryDate || null,
          currency: dto.currency,
          vatApplicable: money.vatApplicable,
          subtotalAmount: money.subtotal,
          discountAmount: money.discount,
          vatAmount: money.vat,
          totalAmount: money.total,
          terms: dto.termsConditions?.trim() || null,
          createdBy: userId,
        },
        items,
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

  async update(tenantId: string, id: string, dto: SaveCloudQuotationDto) {
    const money = this.money(dto);
    const items = this.itemRows(tenantId, dto.items, id);
    if (!dto.customerName.trim() || !dto.quotationNumber.trim() || !dto.quotationDate || items.length === 0) {
      throw new BadRequestException(
        'All header fields and at least one service item line are required.',
      );
    }
    const updated = await this.repository.update(
      tenantId,
      id,
      {
        customerName: dto.customerName.trim(),
        customerAddress: dto.customerAddress?.trim() || null,
        issueDate: dto.quotationDate,
        expiryDate: dto.expiryDate || null,
        currency: dto.currency,
        vatApplicable: money.vatApplicable,
        subtotalAmount: money.subtotal,
        discountAmount: money.discount,
        vatAmount: money.vat,
        totalAmount: money.total,
        terms: dto.termsConditions?.trim() || null,
      },
      items,
    );
    if (!updated) throw new NotFoundException('Quotation record not found.');
    return this.findDetails(tenantId, id);
  }

  async purge(tenantId: string, role: string, id: string) {
    if (!(PHP_ROLE_1 as readonly string[]).includes(role)) {
      throw new ForbiddenException(
        'Unauthorized access: Superadmin permissions required.',
      );
    }
    const removed = await this.repository.purge(tenantId, id);
    if (!removed) throw new NotFoundException('Quotation record not found.');
    return { success: true, message: 'Quotation deleted successfully.' };
  }

  private money(dto: SaveCloudQuotationDto) {
    const subtotal = dto.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );
    const requested = dto.discountValue ?? 0;
    let discount =
      dto.discountType === 'percent' ? subtotal * (requested / 100) : requested;
    if (discount > subtotal) discount = subtotal;
    if (discount < 0) discount = 0;
    const net = subtotal - discount;
    const vatApplicable = dto.currency === 'USD' ? 0 : dto.vatApplicable === false ? 0 : 1;
    const vat = vatApplicable ? this.round2(net * 0.13) : 0;
    const total = this.round2(net + vat);
    return {
      vatApplicable,
      subtotal: this.round2(subtotal).toFixed(2),
      discount: this.round2(discount).toFixed(2),
      vat: vat.toFixed(2),
      total: total.toFixed(2),
    };
  }

  private itemRows(
    tenantId: string,
    items: CloudQuotationItemDto[],
    quotationId = '00000000-0000-0000-0000-000000000000',
  ): NewSalesCloudQuotationItem[] {
    return items
      .filter((item) => item.itemName.trim())
      .map((item, index) => ({
        tenantId,
        quotationId,
        serviceType: item.serviceType.trim() || 'General',
        itemName: item.itemName.trim(),
        description: item.description?.trim() || null,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toFixed(2),
        sortOrder: index,
      }));
  }

  private round2(value: number): number {
    return Math.round(value * 100) / 100;
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

  private isUnique(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === '23505'
    );
  }
}
