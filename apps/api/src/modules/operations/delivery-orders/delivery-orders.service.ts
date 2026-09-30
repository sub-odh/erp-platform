import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { compare } from 'bcrypt';

import {
  CreateDeliveryOrderDto,
  UpdateDeliveryOrderDto,
} from './dto/delivery-order.dto';
import { DeliveryOrdersRepository } from './delivery-orders.repository';

const ROLE_1 = new Set(['OWNER', 'SUPER_ADMIN', 'ADMIN']);

@Injectable()
export class DeliveryOrdersService {
  constructor(private readonly repository: DeliveryOrdersRepository) {}

  list(tenantId: string) {
    return this.repository.list(tenantId);
  }

  listAvailableAssets(tenantId: string) {
    return this.repository.listAvailableAssets(tenantId);
  }

  lookups(tenantId: string) {
    return this.repository.lookups(tenantId);
  }

  async previewNumber(tenantId: string, date: string) {
    return { deliveryNumber: await this.generateNumber(tenantId, date) };
  }

  async findDetails(tenantId: string, id: string) {
    const details = await this.repository.findDetails(tenantId, id);
    if (!details) throw new NotFoundException('Delivery order not found');
    return details;
  }

  async create(
    tenantId: string,
    actorUserId: string,
    dto: CreateDeliveryOrderDto,
  ) {
    for (const item of dto.items) {
      if (!item.assetId && !item.serviceName?.trim()) {
        throw new BadRequestException(
          'Each line needs an inventory item or a service name.',
        );
      }
    }
    const deliveryNumber = await this.generateNumber(tenantId, dto.deliveryDate);
    try {
      return await this.repository.create({
        tenantId,
        actorUserId,
        deliveryNumber,
        deliveryDate: dto.deliveryDate,
        customerName: dto.customerName.trim(),
        customerId: dto.customerId,
        contactName: this.optional(dto.contactName),
        contactPhone: this.optional(dto.contactPhone),
        deliveryAddress: this.optional(dto.deliveryAddress),
        notes: this.optional(dto.notes),
        billable: dto.billable,
        returnValidityDays: dto.returnValidityDays,
        sourceBillNo: this.optional(dto.sourceBillNo),
        soldById: dto.soldById,
        leadId: dto.leadId,
        discountValue: dto.discountValue,
        discountType: dto.discountType,
        taxable: dto.taxable,
        items: dto.items,
      });
    } catch (error: unknown) {
      if (!(error instanceof Error)) throw error;
      if (error.message.startsWith('INSUFFICIENT_STOCK')) {
        const parts = error.message.split(':');
        throw new ConflictException(
          parts.length >= 3
            ? `Insufficient stock for '${parts[1]}'. Available: ${parts[2]}`
            : 'One or more items no longer have enough stock available',
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

  async update(
    tenantId: string,
    actorUserId: string,
    id: string,
    dto: UpdateDeliveryOrderDto,
  ) {
    const current = await this.repository.findDetails(tenantId, id);
    if (!current) throw new NotFoundException('Delivery order not found');
    if (current.order.isVoided === 1) {
      throw new BadRequestException('This delivery order is voided.');
    }
    const updated = await this.repository.updateFinancials(tenantId, actorUserId, id, {
      deliveryDate: dto.deliveryDate,
      sourceBillNo: this.optional(dto.sourceBillNo),
      soldById: dto.soldById,
      leadId: dto.leadId,
      discountValue: dto.discountValue ?? Number(current.order.discountValue),
      discountType: dto.discountType ?? current.order.discountType,
      taxable: dto.taxable ?? current.order.isTaxable === 1,
      lines: dto.items,
    });
    if (!updated) throw new NotFoundException('Delivery order not found');
    return { id, invoiceId: updated.invoiceId };
  }

  async voidOrder(tenantId: string, actorUserId: string, id: string) {
    const current = await this.repository.findDetails(tenantId, id);
    if (!current) throw new NotFoundException('Delivery order not found');
    if (current.order.isVoided === 1) {
      throw new BadRequestException('This delivery order is already voided.');
    }
    let removed: { id: string } | undefined;
    try {
      removed = await this.repository.voidOrder(tenantId, actorUserId, id);
    } catch (error: unknown) {
      if (error instanceof Error && error.message === 'INVOICE_EXISTS') {
        throw new BadRequestException(
          'This delivery order already has an invoice.',
        );
      }
      throw error;
    }
    if (!removed) throw new NotFoundException('Delivery order not found');
    return {
      success: true,
      message: 'Order Voided and Inventory Restored',
    };
  }

  async purge(
    tenantId: string,
    actorUserId: string,
    role: string,
    id: string,
    password: string,
  ) {
    if (!ROLE_1.has(role)) {
      throw new ForbiddenException('Unauthorized');
    }
    if (!password.trim()) {
      throw new BadRequestException('Incorrect Password');
    }
    const actor = await this.repository.findActor(tenantId, actorUserId);
    const matches =
      Boolean(actor?.passwordHash) &&
      (await compare(password, actor?.passwordHash ?? '').catch(() => false));
    if (!matches) throw new BadRequestException('Incorrect Password');
    const removed = await this.repository.purge(tenantId, actorUserId, id);
    if (!removed) throw new NotFoundException('Delivery order not found');
    return { success: true, message: 'Delivery order deleted.' };
  }

  private async generateNumber(tenantId: string, date: string): Promise<string> {
    const year = Number(date.slice(0, 4));
    const latest = await this.repository.latestNumber(tenantId, year);
    const suffix = latest ? Number(latest.split('-').at(-1)) : 0;
    return `DO-${year}-${String((Number.isFinite(suffix) ? suffix : 0) + 1).padStart(3, '0')}`;
  }

  private optional(value: string | undefined): string | undefined {
    const normalized = value?.trim();
    return normalized || undefined;
  }
}
