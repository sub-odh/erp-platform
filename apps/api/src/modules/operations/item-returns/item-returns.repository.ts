import { Injectable } from '@nestjs/common';
import { and, asc, desc, eq, gt, isNull, or, sql, type SQL } from 'drizzle-orm';

import {
  db,
  inventoryAssets,
  inventoryMovements,
  operationsDeliveryOrderItems,
  operationsDeliveryOrders,
  operationsItemReturns,
} from '@erp/db';

interface CreateItemReturnInput {
  tenantId: string;
  actorUserId: string;
  returnNumber: string;
  assetId: string;
  returnDate: string;
  customerName?: string;
  quantity: number;
  reason?: string;
  notes?: string;
}

@Injectable()
export class ItemReturnsRepository {
  list(tenantId: string) {
    return db
      .select({
        id: operationsItemReturns.id,
        returnNumber: operationsItemReturns.returnNumber,
        returnDate: operationsItemReturns.returnDate,
        customerName: operationsItemReturns.customerName,
        quantity: operationsItemReturns.quantity,
        reason: operationsItemReturns.reason,
        itemName: inventoryAssets.itemName,
        serialNumber: inventoryAssets.serialNumber,
      })
      .from(operationsItemReturns)
      .innerJoin(
        inventoryAssets,
        eq(inventoryAssets.id, operationsItemReturns.assetId),
      )
      .where(eq(operationsItemReturns.tenantId, tenantId))
      .orderBy(
        desc(operationsItemReturns.returnDate),
        desc(operationsItemReturns.createdAt),
      );
  }

  listReturnableAssets(tenantId: string) {
    return db
      .select({
        id: inventoryAssets.id,
        itemName: inventoryAssets.itemName,
        serialNumber: inventoryAssets.serialNumber,
        soldQuantity: inventoryAssets.soldQuantity,
        clientName: inventoryAssets.clientName,
      })
      .from(inventoryAssets)
      .where(
        and(
          eq(inventoryAssets.tenantId, tenantId),
          isNull(inventoryAssets.deletedAt),
          gt(inventoryAssets.soldQuantity, 0),
        ),
      )
      .orderBy(inventoryAssets.itemName);
  }

  async latestNumber(
    tenantId: string,
    year: number,
  ): Promise<string | undefined> {
    const [row] = await db
      .select({ returnNumber: operationsItemReturns.returnNumber })
      .from(operationsItemReturns)
      .where(
        and(
          eq(operationsItemReturns.tenantId, tenantId),
          sql`${operationsItemReturns.returnNumber} like ${`RT-${year}-%`}`,
        ),
      )
      .orderBy(desc(operationsItemReturns.returnNumber))
      .limit(1);
    return row?.returnNumber;
  }

  async create(input: CreateItemReturnInput) {
    return db.transaction(async (tx) => {
      const [asset] = await tx
        .select()
        .from(inventoryAssets)
        .where(
          and(
            eq(inventoryAssets.id, input.assetId),
            eq(inventoryAssets.tenantId, input.tenantId),
            isNull(inventoryAssets.deletedAt),
          ),
        )
        .limit(1);
      if (!asset) throw new Error('INVALID_RETURN_ITEM');
      if (input.quantity > asset.soldQuantity) {
        throw new Error('INSUFFICIENT_RETURN_QTY');
      }

      const remainingSold = asset.soldQuantity - input.quantity;
      const stock = asset.stockQuantity + input.quantity;
      const [updatedAsset] = await tx
        .update(inventoryAssets)
        .set({
          stockQuantity: sql`${inventoryAssets.stockQuantity} + ${input.quantity}`,
          soldQuantity: sql`${inventoryAssets.soldQuantity} - ${input.quantity}`,
          status: remainingSold > 0 && stock === 0 ? 'DELIVERED' : 'IN_STOCK',
          updatedBy: input.actorUserId,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(inventoryAssets.id, asset.id),
            eq(inventoryAssets.tenantId, input.tenantId),
            sql`${inventoryAssets.soldQuantity} >= ${input.quantity}`,
          ),
        )
        .returning({ id: inventoryAssets.id });
      if (!updatedAsset) throw new Error('INSUFFICIENT_RETURN_QTY');

      const [record] = await tx
        .insert(operationsItemReturns)
        .values({
          tenantId: input.tenantId,
          returnNumber: input.returnNumber,
          assetId: asset.id,
          returnDate: input.returnDate,
          customerName: input.customerName ?? asset.clientName,
          quantity: input.quantity,
          reason: input.reason,
          notes: input.notes,
          receivedBy: input.actorUserId,
        })
        .returning();
      if (!record) throw new Error('RETURN_CREATE_FAILED');

      await tx.insert(inventoryMovements).values({
        tenantId: input.tenantId,
        assetId: asset.id,
        type: 'RETURN',
        quantityDelta: input.quantity,
        stockQuantityAfter: stock,
        remarks: `Item return ${input.returnNumber}`,
        performedBy: input.actorUserId,
      });

      return record;
    });
  }

  search(tenantId: string, doNumber?: string, serial?: string) {
    const matches: SQL[] = [];
    if (doNumber) {
      matches.push(
        sql`lower(${operationsDeliveryOrders.deliveryNumber}) = lower(${doNumber})`,
      );
    }
    if (serial) {
      matches.push(
        sql`lower(${inventoryAssets.serialNumber}) = lower(${serial})`,
      );
    }
    if (!matches.length) return Promise.resolve([]);
    const match = matches.length === 1 ? matches[0] : or(...matches);

    return db
      .select({
        lineId: operationsDeliveryOrderItems.id,
        id: inventoryAssets.id,
        itemName: inventoryAssets.itemName,
        status: inventoryAssets.status,
        serialNumber: inventoryAssets.serialNumber,
        quantity: operationsDeliveryOrderItems.quantity,
        deliveryNumber: operationsDeliveryOrders.deliveryNumber,
        deliveredAt: operationsDeliveryOrders.createdAt,
        customerName: operationsDeliveryOrders.customerName,
      })
      .from(operationsDeliveryOrderItems)
      .innerJoin(
        operationsDeliveryOrders,
        eq(
          operationsDeliveryOrders.id,
          operationsDeliveryOrderItems.deliveryOrderId,
        ),
      )
      .innerJoin(
        inventoryAssets,
        eq(inventoryAssets.id, operationsDeliveryOrderItems.assetId),
      )
      .where(
        and(
          eq(operationsDeliveryOrderItems.tenantId, tenantId),
          eq(operationsDeliveryOrders.tenantId, tenantId),
          match,
        ),
      )
      .orderBy(asc(inventoryAssets.itemName));
  }

  async process(input: {
    tenantId: string;
    actorUserId: string;
    lineIds: string[];
    returnType: 'standard' | 'damaged';
    remarks: string;
  }): Promise<void> {
    const damaged = input.returnType === 'damaged';
    await db.transaction(async (tx) => {
      for (const lineId of input.lineIds) {
        const [line] = await tx
          .select({
            quantity: operationsDeliveryOrderItems.quantity,
            assetId: inventoryAssets.id,
            stockQuantity: inventoryAssets.stockQuantity,
            soldQuantity: inventoryAssets.soldQuantity,
            damagedQuantity: inventoryAssets.damagedQuantity,
            status: inventoryAssets.status,
          })
          .from(operationsDeliveryOrderItems)
          .innerJoin(
            inventoryAssets,
            eq(inventoryAssets.id, operationsDeliveryOrderItems.assetId),
          )
          .where(
            and(
              eq(operationsDeliveryOrderItems.id, lineId),
              eq(operationsDeliveryOrderItems.tenantId, input.tenantId),
              eq(inventoryAssets.tenantId, input.tenantId),
            ),
          )
          .limit(1);
        if (!line) throw new Error('MISSING_ASSET');

        const soldQuantity = Math.max(0, line.soldQuantity - line.quantity);
        const stockQuantity = damaged
          ? line.stockQuantity
          : line.stockQuantity + line.quantity;
        const damagedQuantity = damaged
          ? line.damagedQuantity + line.quantity
          : line.damagedQuantity;
        const status = damaged
          ? stockQuantity === 0 && soldQuantity === 0
            ? 'DAMAGED'
            : stockQuantity > 0
              ? 'IN_STOCK'
              : line.status
          : soldQuantity === 0
            ? 'RETURNED'
            : stockQuantity > 0
              ? 'IN_STOCK'
              : line.status;

        await tx
          .update(inventoryAssets)
          .set({
            status,
            stockQuantity,
            soldQuantity,
            damagedQuantity,
            deletedAt: null,
            updatedAt: new Date(),
            updatedBy: input.actorUserId,
          })
          .where(
            and(
              eq(inventoryAssets.id, line.assetId),
              eq(inventoryAssets.tenantId, input.tenantId),
            ),
          );

        await tx.insert(inventoryMovements).values({
          tenantId: input.tenantId,
          assetId: line.assetId,
          type: 'RETURN',
          quantityDelta: damaged ? 0 : line.quantity,
          stockQuantityAfter: stockQuantity,
          remarks: input.remarks,
          performedBy: input.actorUserId,
        });
      }
    });
  }
}
