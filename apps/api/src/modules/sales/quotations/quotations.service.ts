import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import type { NewSalesQuotation, NewSalesQuotationItem } from '@erp/db';

import { createPaginatedResult } from '../../../common/pagination';
import {
  CreateQuotationDto,
  ListQuotationsQueryDto,
} from './dto/quotation.dto';
import { QuotationsRepository } from './quotations.repository';

@Injectable()
export class QuotationsService {
  constructor(private readonly repository: QuotationsRepository) {}

  async list(tenantId: string, query: ListQuotationsQueryDto) {
    const result = await this.repository.list({ tenantId, ...query });
    return createPaginatedResult(
      result.data.map((quotation) => this.money(quotation)),
      query.page,
      query.limit,
      result.total,
    );
  }

  async findDetails(tenantId: string, id: string) {
    const quotation = await this.repository.findDetails(tenantId, id);
    if (!quotation) throw new NotFoundException('Quotation not found');
    return {
      ...this.money(quotation),
      items: quotation.items.map((item) => this.money(item)),
    };
  }

  async nextNumber(tenantId: string, date: string) {
    return { quotationNumber: await this.generateNumber(tenantId, date) };
  }

  async create(tenantId: string, actorUserId: string, dto: CreateQuotationDto) {
    if (dto.expiryDate < dto.issueDate) {
      throw new ConflictException(
        'Quotation expiry date must be on or after the issue date',
      );
    }
    const customer = await this.repository.findCustomer(
      tenantId,
      dto.customerId,
    );
    if (!customer) throw new NotFoundException('Active customer not found');

    const now = new Date();
    const id = randomUUID();
    let subtotal = 0;
    const items: NewSalesQuotationItem[] = dto.items.map((item, sortOrder) => {
      const itemName = item.itemName.trim();
      if (!itemName)
        throw new ConflictException(
          'Each quotation line must have an item name',
        );
      const lineTotal = item.quantity * item.unitPrice;
      subtotal += lineTotal;
      return {
        tenantId,
        quotationId: id,
        itemName,
        description: this.optional(item.description),
        quantity: item.quantity,
        unitPrice: item.unitPrice.toFixed(2),
        lineTotal: lineTotal.toFixed(2),
        sortOrder,
      };
    });
    const vat = subtotal * 0.13;
    const quotation: NewSalesQuotation = {
      id,
      tenantId,
      quotationNumber: await this.generateNumber(tenantId, dto.issueDate),
      customerId: customer.id,
      issueDate: dto.issueDate,
      expiryDate: dto.expiryDate,
      destinationAddress: this.optional(dto.destinationAddress),
      terms: this.optional(dto.terms),
      status: 'ACTIVE',
      subtotalAmount: subtotal.toFixed(2),
      vatAmount: vat.toFixed(2),
      totalAmount: (subtotal + vat).toFixed(2),
      createdBy: actorUserId,
      updatedBy: actorUserId,
      createdAt: now,
      updatedAt: now,
    };
    try {
      const created = await this.repository.create(quotation, items);
      return this.findDetails(tenantId, created.id);
    } catch (error: unknown) {
      if (this.databaseErrorCode(error) === '23505') {
        throw new ConflictException(
          'Quotation number already exists. Try saving again.',
        );
      }
      throw error;
    }
  }

  async remove(tenantId: string, actorUserId: string, id: string) {
    const removed = await this.repository.softDelete(tenantId, id, actorUserId);
    if (!removed) throw new NotFoundException('Quotation not found');
  }

  private async generateNumber(tenantId: string, date: string) {
    const year = Number(date.slice(0, 4));
    const latest = await this.repository.latestNumber(tenantId, year);
    const suffix = latest ? Number(latest.split('-').at(-1)) : 0;
    return `QT-${year}-${String((Number.isFinite(suffix) ? suffix : 0) + 1).padStart(4, '0')}`;
  }

  private money<T extends Record<string, unknown>>(value: T): T {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) =>
        key.endsWith('Amount') || key === 'unitPrice' || key === 'lineTotal'
          ? [key, Number(entry)]
          : [key, entry],
      ),
    ) as T;
  }

  private optional(value: string | null | undefined) {
    const normalized = value?.trim();
    return normalized || undefined;
  }

  private databaseErrorCode(error: unknown): string | undefined {
    if (typeof error !== 'object' || error === null) return undefined;
    const record = error as { code?: unknown; cause?: { code?: unknown } };
    return typeof record.code === 'string'
      ? record.code
      : typeof record.cause?.code === 'string'
        ? record.cause.code
        : undefined;
  }
}
