import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { GoodsReceiptsRepository } from './goods-receipts.repository';
import { ReceiveGoodsDto } from './dto/goods-receipt.dto';

@Injectable()
export class GoodsReceiptsService {
  constructor(private readonly repository: GoodsReceiptsRepository) {}

  list(tenantId: string) {
    return this.repository.list(tenantId);
  }

  async receive(tenantId: string, actorUserId: string, dto: ReceiveGoodsDto) {
    const receiptNumber = await this.generateNumber(tenantId, dto.receivedDate);
    try {
      const receipt = await this.repository.receive({
        tenantId,
        actorUserId,
        purchaseOrderId: dto.purchaseOrderId,
        receiptNumber,
        receivedDate: dto.receivedDate,
        deliveryNote: this.optional(dto.deliveryNote),
        notes: this.optional(dto.notes),
        items: dto.items,
      });
      if (!receipt) {
        throw new NotFoundException(
          'Purchase order is unavailable for receiving goods',
        );
      }
      return receipt;
    } catch (error: unknown) {
      if (!(error instanceof Error)) throw error;
      if (error.message === 'OVER_RECEIPT') {
        throw new ConflictException(
          'Received quantity cannot exceed the outstanding purchase-order quantity',
        );
      }
      if (error.message === 'DUPLICATE_RECEIPT_ITEM') {
        throw new ConflictException(
          'Each purchase-order item can be received once per receipt',
        );
      }
      if (error.message === 'INVALID_RECEIPT_ITEM') {
        throw new NotFoundException(
          'One or more purchase-order items were not found',
        );
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
    return `GR-${year}-${String((Number.isFinite(suffix) ? suffix : 0) + 1).padStart(4, '0')}`;
  }

  private optional(value: string | undefined): string | undefined {
    const normalized = value?.trim();
    return normalized || undefined;
  }
}
