import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type {
  CreateInvoiceDto,
  ListInvoicesQueryDto,
  RecordPaymentDto,
} from './dto/invoice.dto';
import { InvoicesRepository } from './invoices.repository';

const VAT_RATE = 0.13;

@Injectable()
export class InvoicesService {
  constructor(private readonly repository: InvoicesRepository) {}

  list(tenantId: string, query: ListInvoicesQueryDto) {
    return this.repository.list(tenantId, {
      search: query.search,
      status: query.status,
    });
  }

  summary(tenantId: string) {
    return this.repository.summary(tenantId);
  }

  async findDetails(tenantId: string, id: string) {
    const invoice = await this.repository.findById(tenantId, id);
    if (!invoice) throw new NotFoundException('Invoice not found');
    return this.money(invoice);
  }

  async generate(tenantId: string, actorUserId: string, dto: CreateInvoiceDto) {
    const existing = await this.repository.findByDeliveryOrder(
      tenantId,
      dto.deliveryOrderId,
    );
    if (existing) {
      throw new ConflictException(
        'An invoice already exists for this delivery order',
      );
    }

    const source = await this.repository.getDeliveryOrderForInvoice(
      tenantId,
      dto.deliveryOrderId,
    );
    if (!source || source.items.length === 0) {
      throw new NotFoundException('Delivery order not found');
    }

    const subtotal = source.items.reduce(
      (sum, item) => sum + Number(item.unitPrice) * item.quantity,
      0,
    );
    const vat = roundMoney(subtotal * VAT_RATE);
    const total = roundMoney(subtotal + vat);
    const invoiceDate = source.order.deliveryDate;
    const invoiceNumber = await this.generateNumber(tenantId, invoiceDate);

    try {
      return await this.repository.create({
        invoice: {
          tenantId,
          invoiceNumber,
          deliveryOrderId: source.order.id,
          customerName: source.order.customerName,
          invoiceDate,
          subtotalAmount: roundMoney(subtotal).toFixed(2),
          vatAmount: vat.toFixed(2),
          totalAmount: total.toFixed(2),
          paidAmount: '0.00',
          status: 'UNPAID',
          createdBy: actorUserId,
        },
        items: source.items.map((item) => ({
          tenantId,
          invoiceId: '00000000-0000-4000-8000-000000000000',
          itemName: item.itemName,
          serialNumber: item.serialNumber,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: (Number(item.unitPrice) * item.quantity).toFixed(2),
        })),
      });
    } catch (error: unknown) {
      if (this.databaseErrorCode(error) === '23505') {
        throw new ConflictException(
          'An invoice already exists for this delivery order',
        );
      }
      throw error;
    }
  }

  async recordPayment(
    tenantId: string,
    actorUserId: string,
    invoiceId: string,
    dto: RecordPaymentDto,
  ) {
    const invoice = await this.repository.findById(tenantId, invoiceId);
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (invoice.status === 'VOID') {
      throw new BadRequestException('Cannot collect payment on a void invoice');
    }
    if (invoice.status === 'PAID') {
      throw new BadRequestException('This invoice is already paid in full');
    }

    const paid = Number(invoice.paidAmount) + dto.amount;
    const total = Number(invoice.totalAmount);
    if (paid - total > 0.009) {
      throw new BadRequestException(
        'Payment exceeds the remaining balance on this invoice',
      );
    }

    const status = paid >= total - 0.009 ? 'PAID' : 'PARTIAL';
    await this.repository.recordPayment(
      tenantId,
      invoiceId,
      {
        amount: dto.amount.toFixed(2),
        method: dto.method,
        referenceNumber: dto.referenceNumber?.trim() || null,
        remarks: dto.remarks?.trim() || null,
        recordedBy: actorUserId,
      },
      paid.toFixed(2),
      status,
    );
    return this.findDetails(tenantId, invoiceId);
  }

  private async generateNumber(tenantId: string, date: string) {
    const year = Number(date.slice(0, 4));
    const latest = await this.repository.latestNumber(tenantId, year);
    const suffix = latest ? Number(latest.split('-').at(-1)) : 0;
    return `INV-${year}-${String((Number.isFinite(suffix) ? suffix : 0) + 1).padStart(4, '0')}`;
  }

  private money<T>(value: T): T {
    return JSON.parse(
      JSON.stringify(value, (_key, current) =>
        typeof current === 'string' && /^-?\d+\.\d+$/.test(current)
          ? Number(current)
          : current,
      ),
    ) as T;
  }

  private databaseErrorCode(error: unknown): string | undefined {
    if (typeof error !== 'object' || error === null || !('code' in error)) {
      return undefined;
    }
    const code = (error as { code?: unknown }).code;
    return typeof code === 'string' ? code : undefined;
  }
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
