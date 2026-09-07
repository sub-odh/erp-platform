import { Injectable } from '@nestjs/common';
import { and, desc, eq, gt, inArray, isNull, sql } from 'drizzle-orm';

import {
  db,
  inventoryAssets,
  inventoryMovements,
  operationsDeliveryOrderItems,
  operationsDeliveryOrders,
} from '@erp/db';

interface CreateDeliveryOrderInput {
  tenantId: string;
  actorUserId: string;
  deliveryNumber: string;
  deliveryDate: string;
  customerName: string;
  contactName?: string;
  contactPhone?: string;
  deliveryAddress?: string;
  notes?: string;
  items: Array<{ assetId: string; quantity: number }>;
}

@Injectable()
export class DeliveryOrdersRepository {
  async list(tenantId: string) {
    return db
      .select({
        id: operationsDeliveryOrders.id,
        deliveryNumber: operationsDeliveryOrders.deliveryNumber,
        deliveryDate: operationsDeliveryOrders.deliveryDate,
        customerName: operationsDeliveryOrders.customerName,
        contactName: operationsDeliveryOrders.contactName,
        totalQuantity: sql<number>`coalesce(sum(${operationsDeliveryOrderItems.quantity}), 0)::int`,
        totalValue: sql<string>`coalesce(sum(${operationsDeliveryOrderItems.quantity} * ${operationsDeliveryOrderItems.unitPrice}), 0)::numeric`,
        createdAt: operationsDeliveryOrders.createdAt,
      })
      .from(operationsDeliveryOrders)
      .leftJoin(
        operationsDeliveryOrderItems,
        eq(
          operationsDeliveryOrderItems.deliveryOrderId,
          operationsDeliveryOrders.id,
        ),
      )
      .where(eq(operationsDeliveryOrders.tenantId, tenantId))
      .groupBy(operationsDeliveryOrders.id)
      .orderBy(
        desc(operationsDeliveryOrders.deliveryDate),
        desc(operationsDeliveryOrders.createdAt),
      );
  }

  async listAvailableAssets(tenantId: string) {
    return db
      .select({
        id: inventoryAssets.id,
        itemName: inventoryAssets.itemName,
        category: inventoryAssets.category,
        serialNumber: inventoryAssets.serialNumber,
        stockQuantity: inventoryAssets.stockQuantity,
        mrpPrice: inventoryAssets.mrpPrice,
      })
      .from(inventoryAssets)
      .where(
        and(
          eq(inventoryAssets.tenantId, tenantId),
          isNull(inventoryAssets.deletedAt),
          gt(inventoryAssets.stockQuantity, 0),
        ),
      )
      .orderBy(inventoryAssets.itemName, inventoryAssets.serialNumber);
  }

  async latestNumber(
    tenantId: string,
    year: number,
  ): Promise<string | undefined> {
    const [row] = await db
      .select({ deliveryNumber: operationsDeliveryOrders.deliveryNumber })
      .from(operationsDeliveryOrders)
      .where(
        and(
          eq(operationsDeliveryOrders.tenantId, tenantId),
          sql`${operationsDeliveryOrders.deliveryNumber} like ${`DO-${year}-%`}`,
        ),
      )
      .orderBy(desc(operationsDeliveryOrders.deliveryNumber))
      .limit(1);
    return row?.deliveryNumber;
  }

  async create(input: CreateDeliveryOrderInput) {
    return db.transaction(async (tx) => {
      const assetIds = input.items.map((item) => item.assetId);
      if (new Set(assetIds).size !== assetIds.length) {
        throw new Error('DUPLICATE_DELIVERY_ITEM');
      }

      const assets = await tx
        .select({
          id: inventoryAssets.id,
          itemName: inventoryAssets.itemName,
          serialNumber: inventoryAssets.serialNumber,
          stockQuantity: inventoryAssets.stockQuantity,
          mrpPrice: inventoryAssets.mrpPrice,
        })
        .from(inventoryAssets)
        .where(
          and(
            eq(inventoryAssets.tenantId, input.tenantId),
            isNull(inventoryAssets.deletedAt),
            inArray(inventoryAssets.id, assetIds),
          ),
        );
      if (assets.length !== input.items.length) {
        throw new Error('INVALID_DELIVERY_ITEM');
      }

      const assetsById = new Map(assets.map((asset) => [asset.id, asset]));
      for (const item of input.items) {
        const asset = assetsById.get(item.assetId);
        if (!asset || item.quantity > asset.stockQuantity) {
          throw new Error('INSUFFICIENT_STOCK');
        }
      }

      const [order] = await tx
        .insert(operationsDeliveryOrders)
        .values({
          tenantId: input.tenantId,
          deliveryNumber: input.deliveryNumber,
          deliveryDate: input.deliveryDate,
          customerName: input.customerName,
          contactName: input.contactName,
          contactPhone: input.contactPhone,
          deliveryAddress: input.deliveryAddress,
          notes: input.notes,
          deliveredBy: input.actorUserId,
        })
        .returning();
      if (!order) throw new Error('DELIVERY_CREATE_FAILED');

      await tx.insert(operationsDeliveryOrderItems).values(
        input.items.map((item) => {
          const asset = assetsById.get(item.assetId)!;
          return {
            tenantId: input.tenantId,
            deliveryOrderId: order.id,
            assetId: asset.id,
            itemName: asset.itemName,
            serialNumber: asset.serialNumber,
            quantity: item.quantity,
            unitPrice: asset.mrpPrice,
          };
        }),
      );

      for (const item of input.items) {
        const asset = assetsById.get(item.assetId)!;
        const remaining = asset.stockQuantity - item.quantity;
        const [updatedAsset] = await tx
          .update(inventoryAssets)
          .set({
            stockQuantity: sql`${inventoryAssets.stockQuantity} - ${item.quantity}`,
            soldQuantity: sql`${inventoryAssets.soldQuantity} + ${item.quantity}`,
            status: remaining === 0 ? 'DELIVERED' : 'IN_STOCK',
            clientName: input.customerName,
            deliveryDate: new Date(`${input.deliveryDate}T00:00:00`),
            updatedBy: input.actorUserId,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(inventoryAssets.id, asset.id),
              eq(inventoryAssets.tenantId, input.tenantId),
              sql`${inventoryAssets.stockQuantity} >= ${item.quantity}`,
            ),
          )
          .returning({ id: inventoryAssets.id });
        if (!updatedAsset) throw new Error('INSUFFICIENT_STOCK');

        await tx.insert(inventoryMovements).values({
          tenantId: input.tenantId,
          assetId: asset.id,
          type: 'SALE',
          quantityDelta: -item.quantity,
          stockQuantityAfter: remaining,
          remarks: `Delivery order ${input.deliveryNumber} to ${input.customerName}`,
          performedBy: input.actorUserId,
        });
      }

      return order;
    });
  }
}
