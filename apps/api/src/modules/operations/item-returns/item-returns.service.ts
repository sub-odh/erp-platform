import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  CreateItemReturnDto,
  LookupItemReturnQueryDto,
  ProcessItemReturnsDto,
} from './dto/item-return.dto';
import { ItemReturnsRepository } from './item-returns.repository';

const RETURN_POLICY_DAYS = 365;
const PROCESSED_STATUSES = new Set(['RETURNED', 'DAMAGED', 'RMA']);

const STATUS_LABELS: Record<string, string> = {
  IN_STOCK: 'Available',
  AVAILABLE: 'Available',
  RETURNED: 'Returned',
  SOLD: 'Sold',
  DELIVERED: 'Delivered',
  DAMAGED: 'Damaged',
  RMA: 'Replaced',
  OUT_OF_STOCK: 'Out of Stock',
  IN_USE: 'In Use',
  POC_LOAN: 'PoC',
};

@Injectable()
export class ItemReturnsService {
  constructor(private readonly repository: ItemReturnsRepository) {}

  list(tenantId: string) {
    return this.repository.list(tenantId);
  }

  listReturnableAssets(tenantId: string) {
    return this.repository.listReturnableAssets(tenantId);
  }

  async lookup(tenantId: string, query: LookupItemReturnQueryDto) {
    const doNumber = query.doNumber?.trim();
    const serial = query.serial?.trim();
    if (!doNumber && !serial) return [];
    const rows = await this.repository.search(tenantId, doNumber, serial);
    return rows.map((row) => {
      const deliveredAt =
        row.deliveredAt instanceof Date
          ? row.deliveredAt
          : new Date(row.deliveredAt);
      const daysOld = daysSince(deliveredAt);
      return {
        lineId: row.lineId,
        id: row.id,
        itemName: row.itemName,
        statusLabel: STATUS_LABELS[row.status] ?? row.status,
        serialNumber: row.serialNumber,
        quantity: row.quantity,
        deliveryNumber: row.deliveryNumber,
        customerName: row.customerName,
        deliveryDate: deliveredAt.toISOString().slice(0, 10),
        daysOld,
        policyDays: RETURN_POLICY_DAYS,
        expired: daysOld > RETURN_POLICY_DAYS,
        processed: PROCESSED_STATUSES.has(row.status),
      };
    });
  }

  async process(
    tenantId: string,
    actorUserId: string,
    dto: ProcessItemReturnsDto,
  ) {
    const lineIds = [...new Set(dto.lineIds)];
    if (!lineIds.length) {
      throw new BadRequestException('No items selected for processing.');
    }
    const remarks =
      dto.returnType === 'damaged'
        ? `DAMAGED: ${dto.remarks?.trim() || 'Marked for Replacement'}`
        : `RETURNED TO STOCK: ${dto.remarks?.trim() ?? ''}`;
    try {
      await this.repository.process({
        tenantId,
        actorUserId,
        lineIds,
        returnType: dto.returnType,
        remarks,
      });
    } catch (error: unknown) {
      if (error instanceof Error && error.message === 'MISSING_ASSET') {
        throw new NotFoundException('Delivered inventory item not found');
      }
      throw error;
    }
    return {
      message: `${lineIds.length} items processed successfully.`,
    };
  }

  async create(
    tenantId: string,
    actorUserId: string,
    dto: CreateItemReturnDto,
  ) {
    const returnNumber = await this.generateNumber(tenantId, dto.returnDate);
    try {
      return await this.repository.create({
        tenantId,
        actorUserId,
        returnNumber,
        assetId: dto.assetId,
        returnDate: dto.returnDate,
        customerName: this.optional(dto.customerName),
        quantity: dto.quantity,
        reason: this.optional(dto.reason),
        notes: this.optional(dto.notes),
      });
    } catch (error: unknown) {
      if (!(error instanceof Error)) throw error;
      if (error.message === 'INSUFFICIENT_RETURN_QTY') {
        throw new ConflictException(
          'Returned quantity cannot exceed delivered quantity',
        );
      }
      if (error.message === 'INVALID_RETURN_ITEM') {
        throw new NotFoundException('Delivered inventory item not found');
      }
      throw error;
    }
  }

  private async generateNumber(
    tenantId: string,
    date: string,
  ): Promise<string> {
    const year = Number(date.slice(0, 4));
    const latest = await this.repository.latestNumber(tenantId, year);
    const suffix = latest ? Number(latest.split('-').at(-1)) : 0;
    return `RT-${year}-${String((Number.isFinite(suffix) ? suffix : 0) + 1).padStart(4, '0')}`;
  }

  private optional(value: string | undefined): string | undefined {
    const normalized = value?.trim();
    return normalized || undefined;
  }
}

function daysSince(value: Date): number {
  const start = Date.UTC(
    value.getFullYear(),
    value.getMonth(),
    value.getDate(),
  );
  const today = new Date();
  const end = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  return Math.abs(Math.round((end - start) / 86_400_000));
}
