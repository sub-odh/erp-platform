import { Injectable } from '@nestjs/common';
import { and, desc, eq, gt, isNull, sql } from 'drizzle-orm';

import {
  db,
  inventoryAssets,
  inventoryMovements,
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
}
