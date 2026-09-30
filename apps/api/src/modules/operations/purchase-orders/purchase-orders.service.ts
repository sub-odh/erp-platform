import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { compare } from 'bcrypt';

import type { NewOperationsPurchaseOrderItem } from '@erp/db';

import { CompanyService } from '../../company/company.service';
import { amountInWords, proformaTotal } from '../../sales/proforma-invoices/pi-words';
import { SmtpService } from '../../smtp/smtp.service';
import type {
  DispatchPurchaseOrderDto,
  ListPurchaseOrdersQueryDto,
  PurchaseOrderItemDto,
  SavePurchaseOrderDto,
} from './dto/purchase-order.dto';
import { PurchaseOrdersRepository } from './purchase-orders.repository';

const ROLE_POSITION: Record<string, string> = {
  OWNER: 'Super Admin',
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Super Admin',
  HR: 'HR',
  OPERATIONS: 'Operations',
  MANAGER: 'Operations',
  EMPLOYEE: 'Employee',
  SALES: 'Sales',
  STAFF: 'Sales',
  MANAGEMENT: 'Management',
  HEAD: 'Head',
};

@Injectable()
export class PurchaseOrdersService {
  constructor(
    private readonly repository: PurchaseOrdersRepository,
    private readonly companyService: CompanyService,
    private readonly smtp: SmtpService,
  ) {}

  async draft(tenantId: string, userId: string) {
    const [sequence, actor] = await Promise.all([
      this.repository.nextSequence(tenantId),
      this.repository.findActor(tenantId, userId),
    ]);
    const year = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kathmandu',
      year: 'numeric',
    }).format(new Date());
    return {
      poNumber: `PO-${year}-${String(sequence).padStart(3, '0')}`,
      poDate: new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kathmandu',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date()),
      preparedBy: actor
        ? `${actor.firstName} ${actor.lastName}`.trim()
        : 'Authorized Officer',
      position: ROLE_POSITION[actor?.role ?? ''] ?? 'Sales / Operations Department',
    };
  }

  async list(tenantId: string, query: ListPurchaseOrdersQueryDto) {
    const rows = await this.repository.list(tenantId, query);
    return rows.map((row) => ({
      ...row,
      generatedBy:
        `${row.creatorFirstName ?? ''} ${row.creatorLastName ?? ''}`.trim() ||
        'System',
    }));
  }

  async findDetails(tenantId: string, id: string) {
    const header = await this.repository.findHeader(tenantId, id);
    if (!header) throw new NotFoundException('Purchase Order record not found.');
    const items = await this.repository.findItems(tenantId, id);
    const currency = header.currency === 'USD' ? 'USD' : 'NPR';
    return {
      ...header,
      currency,
      items,
      totalInWords: amountInWords(Number(header.totalAmount), currency),
      preparedBy:
        `${header.creatorFirstName ?? ''} ${header.creatorLastName ?? ''}`.trim() ||
        'System',
      position:
        ROLE_POSITION[header.creatorRole ?? ''] ??
        'Sales / Operations Department',
    };
  }

  async create(tenantId: string, userId: string, dto: SavePurchaseOrderDto) {
    const sequence = await this.repository.nextSequence(tenantId);
    try {
      const created = await this.repository.create(
        {
          tenantId,
          sequence,
          poNumber: dto.poNumber.trim(),
          vendorId: null,
          vendorDetails: dto.vendorDetails.trim(),
          billTo: dto.billTo.trim(),
          shipTo: dto.shipTo.trim(),
          termsConditions: this.optional(dto.termsConditions),
          currency: dto.currency,
          poDate: dto.poDate,
          status: 'ISSUED',
          totalAmount: this.money(dto.items, dto.currency),
          createdBy: userId,
        },
        this.itemRows(tenantId, dto.items),
      );
      return this.findDetails(tenantId, created.id);
    } catch (error: unknown) {
      if (this.isUnique(error)) {
        throw new BadRequestException(
          'That PO number was just used. Reload the page and save again.',
        );
      }
      throw new BadRequestException('Error generating Purchase Order.');
    }
  }

  async update(
    tenantId: string,
    id: string,
    dto: SavePurchaseOrderDto,
  ) {
    const updated = await this.repository.update(
      tenantId,
      id,
      {
        poNumber: dto.poNumber.trim(),
        vendorDetails: dto.vendorDetails.trim(),
        billTo: dto.billTo.trim(),
        shipTo: dto.shipTo.trim(),
        termsConditions: this.optional(dto.termsConditions),
        currency: dto.currency,
        poDate: dto.poDate,
        totalAmount: this.money(dto.items, dto.currency),
      },
      this.itemRows(tenantId, dto.items, id),
    );
    if (!updated) {
      throw new NotFoundException('Purchase Order record not found.');
    }
    return this.findDetails(tenantId, id);
  }

  async purge(tenantId: string, userId: string, id: string, password: string) {
    if (!password.trim()) {
      throw new BadRequestException('Missing required parameter definitions.');
    }
    const actor = await this.repository.findActor(tenantId, userId);
    const matches =
      Boolean(actor?.passwordHash) &&
      (await compare(password, actor?.passwordHash ?? '').catch(() => false));
    if (!matches) {
      throw new BadRequestException(
        'Security clearance failed! Invalid password.',
      );
    }
    const removed = await this.repository.purge(tenantId, id);
    if (!removed) {
      throw new NotFoundException('Purchase Order record not found.');
    }
    return {
      success: true,
      message: 'Purchase Order permanently erased.',
    };
  }

  async dispatch(tenantId: string, dto: DispatchPurchaseOrderDto) {
    const company = await this.companyService.findCurrent(tenantId);
    const companyName = company.legalName?.trim() || company.name;
    const notes = dto.emailBodyNotes?.trim();
    const text = [
      notes || 'Please find the official purchase order for the requested items.',
      '',
      `Purchase Order: ${dto.poNumber.trim()}`,
      companyName,
    ].join('\n');
    try {
      await this.smtp.send(tenantId, {
        to: dto.recipientEmail.trim(),
        subject: dto.emailSubject.trim(),
        text,
      });
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw new BadRequestException(
          'SMTP is not configured. Set it up before sending email.',
        );
      }
      throw new BadRequestException(
        'The email could not be sent. Check SMTP settings.',
      );
    }
    return {
      success: true,
      message: `Purchase order was sent to ${dto.recipientEmail.trim()}.`,
    };
  }

  private money(items: PurchaseOrderItemDto[], currency: 'NPR' | 'USD'): string {
    return proformaTotal(items, currency).total.toFixed(2);
  }

  private itemRows(
    tenantId: string,
    items: PurchaseOrderItemDto[],
    purchaseOrderId = '00000000-0000-0000-0000-000000000000',
  ): NewOperationsPurchaseOrderItem[] {
    return items.map((item, index) => ({
      tenantId,
      purchaseOrderId,
      productId: null,
      productName: item.itemName?.trim() ?? '',
      partNumber: item.partNumber?.trim() ?? '',
      description: item.description?.trim() || null,
      quantity: item.quantity,
      unitSymbol: 'pcs',
      unitPrice: item.unitPrice.toFixed(2),
      sortOrder: index,
    }));
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
