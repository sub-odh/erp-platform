import { Injectable } from '@nestjs/common';
import {
  and,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  isNull,
  lte,
  or,
  sql,
  type SQL,
} from 'drizzle-orm';

import {
  db,
  operationsProducts,
  operationsPurchaseOrderItems,
  operationsPurchaseOrders,
  operationsUnits,
  operationsVendors,
  type NewOperationsPurchaseOrder,
  type NewOperationsPurchaseOrderItem,
} from '@erp/db';

import { getPaginationOffset } from '../../../common/pagination';
import type { ListPurchaseOrdersQueryDto } from './dto/purchase-order.dto';

interface ListInput extends ListPurchaseOrdersQueryDto {
  tenantId: string;
}

@Injectable()
export class PurchaseOrdersRepository {
  async list(input: ListInput) {
    const conditions: SQL[] = [
      eq(operationsPurchaseOrders.tenantId, input.tenantId),
      isNull(operationsPurchaseOrders.deletedAt),
    ];
    if (input.search) {
      const pattern = `%${input.search.trim()}%`;
      const search = or(
        ilike(operationsPurchaseOrders.poNumber, pattern),
        ilike(operationsVendors.name, pattern),
        ilike(operationsVendors.code, pattern),
      );
      if (search) conditions.push(search);
    }
    if (input.vendorId) {
      conditions.push(eq(operationsPurchaseOrders.vendorId, input.vendorId));
    }
    if (input.fromDate) {
      conditions.push(gte(operationsPurchaseOrders.poDate, input.fromDate));
    }
    if (input.toDate) {
      conditions.push(lte(operationsPurchaseOrders.poDate, input.toDate));
    }

    const [data, countRows] = await Promise.all([
      db
        .select({
          id: operationsPurchaseOrders.id,
          poNumber: operationsPurchaseOrders.poNumber,
          poDate: operationsPurchaseOrders.poDate,
          vendorId: operationsPurchaseOrders.vendorId,
          vendorCode: operationsVendors.code,
          vendorName: operationsVendors.name,
          attentionContact: operationsPurchaseOrders.attentionContact,
          status: operationsPurchaseOrders.status,
          totalAmount: operationsPurchaseOrders.totalAmount,
          createdAt: operationsPurchaseOrders.createdAt,
        })
        .from(operationsPurchaseOrders)
        .innerJoin(
          operationsVendors,
          eq(operationsVendors.id, operationsPurchaseOrders.vendorId),
        )
        .where(and(...conditions))
        .orderBy(
          desc(operationsPurchaseOrders.poDate),
          desc(operationsPurchaseOrders.createdAt),
        )
        .limit(input.limit)
        .offset(getPaginationOffset(input)),
      db
        .select({ total: sql<number>`count(*)::int` })
        .from(operationsPurchaseOrders)
        .innerJoin(
          operationsVendors,
          eq(operationsVendors.id, operationsPurchaseOrders.vendorId),
        )
        .where(and(...conditions)),
    ]);
    return { data, total: countRows[0]?.total ?? 0 };
  }

  async findDetails(tenantId: string, id: string) {
    const [order] = await db
      .select({
        id: operationsPurchaseOrders.id,
        poNumber: operationsPurchaseOrders.poNumber,
        poDate: operationsPurchaseOrders.poDate,
        vendorId: operationsPurchaseOrders.vendorId,
        vendorCode: operationsVendors.code,
        vendorName: operationsVendors.name,
        vendorAddress: operationsVendors.address,
        vendorEmail: operationsVendors.email,
        vendorPhone: operationsVendors.phone,
        attentionContact: operationsPurchaseOrders.attentionContact,
        deliveryAddress: operationsPurchaseOrders.deliveryAddress,
        paymentTerms: operationsPurchaseOrders.paymentTerms,
        notes: operationsPurchaseOrders.notes,
        status: operationsPurchaseOrders.status,
        totalAmount: operationsPurchaseOrders.totalAmount,
        createdAt: operationsPurchaseOrders.createdAt,
      })
      .from(operationsPurchaseOrders)
      .innerJoin(
        operationsVendors,
        eq(operationsVendors.id, operationsPurchaseOrders.vendorId),
      )
      .where(
        and(
          eq(operationsPurchaseOrders.tenantId, tenantId),
          eq(operationsPurchaseOrders.id, id),
          isNull(operationsPurchaseOrders.deletedAt),
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
        unitSymbol: operationsPurchaseOrderItems.unitSymbol,
        quantity: operationsPurchaseOrderItems.quantity,
        unitPrice: operationsPurchaseOrderItems.unitPrice,
        lineTotal: operationsPurchaseOrderItems.lineTotal,
        receivedQuantity: operationsPurchaseOrderItems.receivedQuantity,
      })
      .from(operationsPurchaseOrderItems)
      .where(eq(operationsPurchaseOrderItems.purchaseOrderId, id))
      .orderBy(operationsPurchaseOrderItems.sortOrder);
    return { ...order, items };
  }

  async findVendor(tenantId: string, id: string) {
    const [vendor] = await db
      .select()
      .from(operationsVendors)
      .where(
        and(
          eq(operationsVendors.tenantId, tenantId),
          eq(operationsVendors.id, id),
          eq(operationsVendors.isActive, true),
          isNull(operationsVendors.deletedAt),
        ),
      )
      .limit(1);
    return vendor;
  }

  async findProducts(tenantId: string, ids: string[]) {
    if (ids.length === 0) return [];
    return db
      .select({
        id: operationsProducts.id,
        name: operationsProducts.name,
        description: operationsProducts.description,
        unitSymbol: operationsUnits.symbol,
        purchasePrice: operationsProducts.purchasePrice,
        isActive: operationsProducts.isActive,
      })
      .from(operationsProducts)
      .innerJoin(
        operationsUnits,
        eq(operationsUnits.id, operationsProducts.unitId),
      )
      .where(
        and(
          eq(operationsProducts.tenantId, tenantId),
          isNull(operationsProducts.deletedAt),
          inArray(operationsProducts.id, ids),
        ),
      );
  }

  async latestNumber(tenantId: string, year: number) {
    const prefix = `PO-${year}-`;
    const [row] = await db
      .select({ poNumber: operationsPurchaseOrders.poNumber })
      .from(operationsPurchaseOrders)
      .where(
        and(
          eq(operationsPurchaseOrders.tenantId, tenantId),
          ilike(operationsPurchaseOrders.poNumber, `${prefix}%`),
        ),
      )
      .orderBy(desc(operationsPurchaseOrders.poNumber))
      .limit(1);
    return row?.poNumber;
  }

  async create(
    order: NewOperationsPurchaseOrder,
    items: NewOperationsPurchaseOrderItem[],
  ) {
    return db.transaction(async (tx) => {
      const [created] = await tx
        .insert(operationsPurchaseOrders)
        .values(order)
        .returning();
      if (!created)
        throw new Error('Database did not return the purchase order');
      await tx.insert(operationsPurchaseOrderItems).values(items);
      return created;
    });
  }
}
