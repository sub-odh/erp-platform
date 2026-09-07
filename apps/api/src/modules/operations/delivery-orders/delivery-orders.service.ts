import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CreateDeliveryOrderDto } from './dto/delivery-order.dto';
import { DeliveryOrdersRepository } from './delivery-orders.repository';

@Injectable()
export class DeliveryOrdersService {
  constructor(private readonly repository: DeliveryOrdersRepository) {}

  list(tenantId: string) {
    return this.repository.list(tenantId);
  }

  listAvailableAssets(tenantId: string) {
    return this.repository.listAvailableAssets(tenantId);
  }

  async create(
    tenantId: string,
    actorUserId: string,
    dto: CreateDeliveryOrderDto,
  ) {
    const deliveryNumber = await this.generateNumber(
      tenantId,
      dto.deliveryDate,
    );
    try {
      return await this.repository.create({
        tenantId,
        actorUserId,
        deliveryNumber,
        deliveryDate: dto.deliveryDate,
        customerName: dto.customerName.trim(),
        contactName: this.optional(dto.contactName),
        contactPhone: this.optional(dto.contactPhone),
        deliveryAddress: this.optional(dto.deliveryAddress),
        notes: this.optional(dto.notes),
        items: dto.items,
      });
    } catch (error: unknown) {
      if (!(error instanceof Error)) throw error;
      if (error.message === 'INSUFFICIENT_STOCK') {
        throw new ConflictException(
          'One or more items no longer have enough stock available',
        );
      }
      if (error.message === 'DUPLICATE_DELIVERY_ITEM') {
        throw new ConflictException(
          'Each inventory item can be added only once to a delivery order',
        );
      }
      if (error.message === 'INVALID_DELIVERY_ITEM') {
        throw new NotFoundException(
          'One or more inventory items were not found',
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
    return `DO-${year}-${String((Number.isFinite(suffix) ? suffix : 0) + 1).padStart(4, '0')}`;
  }

  private optional(value: string | undefined): string | undefined {
    const normalized = value?.trim();
    return normalized || undefined;
  }
}
