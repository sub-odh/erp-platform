import { Injectable } from '@nestjs/common';
import { and, desc, eq, isNull, ne, sql } from 'drizzle-orm';

import {
  db,
  inventoryAssets,
  inventoryMovements,
  operationsCategories,
  operationsGoodsReceiptItems,
  operationsGoodsReceipts,
  operationsProducts,
  operationsPurchaseOrderItems,
  operationsPurchaseOrders,
  operationsVendors,
} from '@erp/db';

interface ReceiveGoodsInput {
  tenantId: string;
  actorUserId: string;
  purchaseOrderId: string;
  receiptNumber: string;
  receivedDate: string;
  deliveryNote?: string;
  notes?: string;
  items: Array<{ purchaseOrderItemId: string; quantity: number }>;
}

@Injectable()
export class GoodsReceiptsRepository {
  async list(tenantId: string) {
    return db
      .select({
        id: operationsGoodsReceipts.id,
        receiptNumber: operationsGoodsReceipts.receiptNumber,
        receivedDate: operationsGoodsReceipts.receivedDate,
        deliveryNote: operationsGoodsReceipts.deliveryNote,
        purchaseOrderId: operationsPurchaseOrders.id,
        poNumber: operationsPurchaseOrders.poNumber,
        vendorName: operationsVendors.name,
        totalQuantity: sql<number>`coalesce(sum(${operationsGoodsReceiptItems.quantity}), 0)::int`,
        createdAt: operationsGoodsReceipts.createdAt,
      })
      .from(operationsGoodsReceipts)
      .innerJoin(
        operationsPurchaseOrders,
        eq(
          operationsPurchaseOrders.id,
          operationsGoodsReceipts.purchaseOrderId,
        ),
      )
      .innerJoin(
        operationsVendors,
        eq(operationsVendors.id, operationsPurchaseOrders.vendorId),
      )
      .leftJoin(
        operationsGoodsReceiptItems,
        eq(
          operationsGoodsReceiptItems.goodsReceiptId,
          operationsGoodsReceipts.id,
        ),
      )
      .where(eq(operationsGoodsReceipts.tenantId, tenantId))
      .groupBy(
        operationsGoodsReceipts.id,
        operationsPurchaseOrders.id,
        operationsVendors.id,
      )
      .orderBy(
        desc(operationsGoodsReceipts.receivedDate),
        desc(operationsGoodsReceipts.createdAt),
      );
  }

  async findReceivablePurchaseOrder(tenantId: string, purchaseOrderId: string) {
    const [order] = await db
      .select({
        id: operationsPurchaseOrders.id,
        poNumber: operationsPurchaseOrders.poNumber,
        vendorName: operationsVendors.name,
        status: operationsPurchaseOrders.status,
      })
      .from(operationsPurchaseOrders)
      .innerJoin(
        operationsVendors,
        eq(operationsVendors.id, operationsPurchaseOrders.vendorId),
      )
      .where(
        and(
          eq(operationsPurchaseOrders.id, purchaseOrderId),
          eq(operationsPurchaseOrders.tenantId, tenantId),
          isNull(operationsPurchaseOrders.deletedAt),
          ne(operationsPurchaseOrders.status, 'CANCELLED'),
          ne(operationsPurchaseOrders.status, 'RECEIVED'),
        ),
      )
      .limit(1);

    if (!order) return undefined;

    const items = await db
      .select({
        id: operationsPurchaseOrderItems.id,
        productId: operationsPurchaseOrderItems.productId,
        productName: operationsPurchaseOrderItems.productName,
        description: operationsPurchaseOrderItems.description,
        quantity: operationsPurchaseOrderItems.quantity,
        receivedQuantity: operationsPurchaseOrderItems.receivedQuantity,
        unitPrice: operationsPurchaseOrderItems.unitPrice,
        productSku: operationsProducts.sku,
        productSellingPrice: operationsProducts.sellingPrice,
        categoryName: operationsCategories.name,
      })
      .from(operationsPurchaseOrderItems)
      .leftJoin(
        operationsProducts,
        eq(operationsProducts.id, operationsPurchaseOrderItems.productId),
      )
      .leftJoin(
        operationsCategories,
        eq(operationsCategories.id, operationsProducts.categoryId),
      )
      .where(
        and(
          eq(operationsPurchaseOrderItems.tenantId, tenantId),
          eq(operationsPurchaseOrderItems.purchaseOrderId, purchaseOrderId),
        ),
      )
      .orderBy(operationsPurchaseOrderItems.sortOrder);

    return { ...order, items };
  }

  async latestNumber(
    tenantId: string,
    year: number,
  ): Promise<string | undefined> {
    const [row] = await db
      .select({ receiptNumber: operationsGoodsReceipts.receiptNumber })
      .from(operationsGoodsReceipts)
      .where(
        and(
          eq(operationsGoodsReceipts.tenantId, tenantId),
          sql`${operationsGoodsReceipts.receiptNumber} like ${`GR-${year}-%`}`,
        ),
      )
      .orderBy(desc(operationsGoodsReceipts.receiptNumber))
      .limit(1);
    return row?.receiptNumber;
  }

  async receive(input: ReceiveGoodsInput) {
    return db.transaction(async (tx) => {
      const order = await this.findReceivablePurchaseOrder(
        input.tenantId,
        input.purchaseOrderId,
      );
      if (!order) return undefined;

      const inputItemIds = input.items.map((item) => item.purchaseOrderItemId);
      if (new Set(inputItemIds).size !== inputItemIds.length) {
        throw new Error('DUPLICATE_RECEIPT_ITEM');
      }
      const orderItems = order.items.filter((item) =>
        inputItemIds.includes(item.id),
      );
      if (orderItems.length !== input.items.length) {
        throw new Error('INVALID_RECEIPT_ITEM');
      }

      const itemById = new Map(orderItems.map((item) => [item.id, item]));
      for (const inputItem of input.items) {
        const orderItem = itemById.get(inputItem.purchaseOrderItemId);
        if (
          !orderItem ||
          orderItem.receivedQuantity + inputItem.quantity > orderItem.quantity
        ) {
          throw new Error('OVER_RECEIPT');
        }
      }

      const [receipt] = await tx
        .insert(operationsGoodsReceipts)
        .values({
          tenantId: input.tenantId,
          receiptNumber: input.receiptNumber,
          purchaseOrderId: input.purchaseOrderId,
          receivedDate: input.receivedDate,
          deliveryNote: input.deliveryNote,
          notes: input.notes,
          receivedBy: input.actorUserId,
        })
        .returning();
      if (!receipt) throw new Error('RECEIPT_CREATE_FAILED');

      await tx.insert(operationsGoodsReceiptItems).values(
        input.items.map((inputItem) => {
          const orderItem = itemById.get(inputItem.purchaseOrderItemId)!;
          return {
            tenantId: input.tenantId,
            goodsReceiptId: receipt.id,
            purchaseOrderItemId: orderItem.id,
            productId: orderItem.productId,
            productName: orderItem.productName,
            quantity: inputItem.quantity,
          };
        }),
      );

      for (const inputItem of input.items) {
        const orderItem = itemById.get(inputItem.purchaseOrderItemId)!;
        const [updatedOrderItem] = await tx
          .update(operationsPurchaseOrderItems)
          .set({
            receivedQuantity: sql`${operationsPurchaseOrderItems.receivedQuantity} + ${inputItem.quantity}`,
          })
          .where(
            and(
              eq(operationsPurchaseOrderItems.id, orderItem.id),
              eq(operationsPurchaseOrderItems.tenantId, input.tenantId),
              sql`${operationsPurchaseOrderItems.receivedQuantity} + ${inputItem.quantity} <= ${operationsPurchaseOrderItems.quantity}`,
            ),
          )
          .returning({
            receivedQuantity: operationsPurchaseOrderItems.receivedQuantity,
          });
        if (!updatedOrderItem) throw new Error('OVER_RECEIPT');

        const [asset] = await tx
          .insert(inventoryAssets)
          .values({
            tenantId: input.tenantId,
            itemName: orderItem.productName,
            category: orderItem.categoryName ?? 'General',
            vendor: order.vendorName,
            modelNumber: orderItem.productSku,
            purchaseSource: `Goods receipt ${input.receiptNumber}`,
            purchaseDate: input.receivedDate,
            stockQuantity: inputItem.quantity,
            purchasePrice: orderItem.unitPrice,
            mrpPrice: orderItem.productSellingPrice ?? orderItem.unitPrice,
            status: 'IN_STOCK',
            notes: input.notes,
            createdBy: input.actorUserId,
            updatedBy: input.actorUserId,
          })
          .returning();
        if (!asset) throw new Error('INVENTORY_CREATE_FAILED');

        await tx.insert(inventoryMovements).values({
          tenantId: input.tenantId,
          assetId: asset.id,
          type: 'ADDITION',
          quantityDelta: inputItem.quantity,
          stockQuantityAfter: inputItem.quantity,
          remarks: `Goods receipt ${input.receiptNumber} for ${order.poNumber}`,
          performedBy: input.actorUserId,
        });
      }

      const [{ outstandingCount = 0 } = {}] = await tx
        .select({
          outstandingCount: sql<number>`count(*)::int`,
        })
        .from(operationsPurchaseOrderItems)
        .where(
          and(
            eq(
              operationsPurchaseOrderItems.purchaseOrderId,
              input.purchaseOrderId,
            ),
            eq(operationsPurchaseOrderItems.tenantId, input.tenantId),
            sql`${operationsPurchaseOrderItems.receivedQuantity} < ${operationsPurchaseOrderItems.quantity}`,
          ),
        );
      await tx
        .update(operationsPurchaseOrders)
        .set({
          status: outstandingCount === 0 ? 'RECEIVED' : 'PARTIALLY_RECEIVED',
          updatedBy: input.actorUserId,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(operationsPurchaseOrders.id, input.purchaseOrderId),
            eq(operationsPurchaseOrders.tenantId, input.tenantId),
          ),
        );

      return receipt;
    });
  }
}
