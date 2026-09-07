import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CreateItemReturnDto } from './dto/item-return.dto';
import { ItemReturnsRepository } from './item-returns.repository';

@Injectable()
export class ItemReturnsService {
  constructor(private readonly repository: ItemReturnsRepository) {}

  list(tenantId: string) {
    return this.repository.list(tenantId);
  }

  listReturnableAssets(tenantId: string) {
    return this.repository.listReturnableAssets(tenantId);
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
