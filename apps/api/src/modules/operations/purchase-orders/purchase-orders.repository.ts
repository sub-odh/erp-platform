import { Injectable } from '@nestjs/common';
import {
  and,
  asc,
  desc,
  eq,
  gte,
  ilike,
  isNull,
  lte,
  or,
  sql,
  type SQL,
} from 'drizzle-orm';

import {
  db,
  hrEmployees,
  operationsPurchaseOrderItems,
  operationsPurchaseOrders,
  operationsVendors,
  users,
  type NewOperationsPurchaseOrderItem,
} from '@erp/db';

import type { ListPurchaseOrdersQueryDto } from './dto/purchase-order.dto';

@Injectable()
export class PurchaseOrdersRepository {
  async nextSequence(tenantId: string): Promise<number> {
    const [row] = await db
      .select({
        max: sql<number>`coalesce(max(${operationsPurchaseOrders.sequence}), 0)::int`,
      })
      .from(operationsPurchaseOrders)
      .where(eq(operationsPurchaseOrders.tenantId, tenantId));
    return (row?.max ?? 0) + 1;
  }

  async list(tenantId: string, query: ListPurchaseOrdersQueryDto) {
    const vendorText = sql<string>`coalesce(${operationsPurchaseOrders.vendorDetails}, ${operationsVendors.name}, '')`;
    const conditions: SQL[] = [
      eq(operationsPurchaseOrders.tenantId, tenantId),
      isNull(operationsPurchaseOrders.deletedAt),
    ];
    const vendor = query.searchVendor?.trim();
    if (vendor) {
      const pattern = `%${vendor}%`;
      const match = or(
        ilike(vendorText, pattern),
        ilike(operationsPurchaseOrders.billTo, pattern),
      );
      if (match) conditions.push(match);
    }
    const number = query.searchPoNum?.trim();
    if (number) {
      conditions.push(
        ilike(operationsPurchaseOrders.poNumber, `%${number}%`),
      );
    }
    if (query.startDate) {
      conditions.push(gte(operationsPurchaseOrders.poDate, query.startDate));
    }
    if (query.endDate) {
      conditions.push(lte(operationsPurchaseOrders.poDate, query.endDate));
    }
    const creatorFirst = sql<string>`coalesce(${hrEmployees.firstName}, ${users.firstName})`;
    const direction = query.direction === 'asc' ? asc : desc;
    const sortColumn = {
      po_number: operationsPurchaseOrders.poNumber,
      po_date: operationsPurchaseOrders.poDate,
      vendor_name: vendorText,
      total_amount: operationsPurchaseOrders.totalAmount,
      first_name: creatorFirst,
    }[query.sort ?? 'po_date'];

    return db
      .select({
        id: operationsPurchaseOrders.id,
        poNumber: operationsPurchaseOrders.poNumber,
        poDate: operationsPurchaseOrders.poDate,
        vendorDetails: vendorText,
        totalAmount: operationsPurchaseOrders.totalAmount,
        currency: operationsPurchaseOrders.currency,
        creatorFirstName: creatorFirst,
        creatorLastName: sql<string>`coalesce(${hrEmployees.lastName}, ${users.lastName})`,
      })
      .from(operationsPurchaseOrders)
      .leftJoin(
        operationsVendors,
        eq(operationsVendors.id, operationsPurchaseOrders.vendorId),
      )
      .leftJoin(users, eq(users.id, operationsPurchaseOrders.createdBy))
      .leftJoin(
        hrEmployees,
        and(
          eq(hrEmployees.userId, users.id),
          eq(hrEmployees.tenantId, operationsPurchaseOrders.tenantId),
        ),
      )
      .where(and(...conditions))
      .orderBy(direction(sortColumn));
  }

  async findHeader(tenantId: string, id: string) {
    const [row] = await db
      .select({
        id: operationsPurchaseOrders.id,
        poNumber: operationsPurchaseOrders.poNumber,
        poDate: operationsPurchaseOrders.poDate,
        vendorDetails: sql<string>`coalesce(${operationsPurchaseOrders.vendorDetails}, ${operationsVendors.name}, '')`,
        billTo: sql<string>`coalesce(${operationsPurchaseOrders.billTo}, ${operationsPurchaseOrders.deliveryAddress}, '')`,
        shipTo: sql<string>`coalesce(${operationsPurchaseOrders.shipTo}, '')`,
        termsConditions: sql<string>`coalesce(${operationsPurchaseOrders.termsConditions}, ${operationsPurchaseOrders.notes}, '')`,
        totalAmount: operationsPurchaseOrders.totalAmount,
        currency: operationsPurchaseOrders.currency,
        createdAt: operationsPurchaseOrders.createdAt,
        creatorFirstName: sql<string | null>`coalesce(${hrEmployees.firstName}, ${users.firstName})`,
        creatorLastName: sql<string | null>`coalesce(${hrEmployees.lastName}, ${users.lastName})`,
        creatorRole: users.role,
        signatureUrl: sql<string | null>`coalesce(${hrEmployees.signatureUrl}, ${users.signatureUrl})`,
      })
      .from(operationsPurchaseOrders)
      .leftJoin(
        operationsVendors,
        eq(operationsVendors.id, operationsPurchaseOrders.vendorId),
      )
      .leftJoin(users, eq(users.id, operationsPurchaseOrders.createdBy))
      .leftJoin(
        hrEmployees,
        and(
          eq(hrEmployees.userId, users.id),
          eq(hrEmployees.tenantId, operationsPurchaseOrders.tenantId),
        ),
      )
      .where(
        and(
          eq(operationsPurchaseOrders.tenantId, tenantId),
          eq(operationsPurchaseOrders.id, id),
          isNull(operationsPurchaseOrders.deletedAt),
        ),
      )
      .limit(1);
    return row;
  }

  async findItems(tenantId: string, purchaseOrderId: string) {
    return db
      .select({
        id: operationsPurchaseOrderItems.id,
        itemName: operationsPurchaseOrderItems.productName,
        partNumber: operationsPurchaseOrderItems.partNumber,
        description: operationsPurchaseOrderItems.description,
        quantity: operationsPurchaseOrderItems.quantity,
        unitPrice: operationsPurchaseOrderItems.unitPrice,
      })
      .from(operationsPurchaseOrderItems)
      .where(
        and(
          eq(operationsPurchaseOrderItems.tenantId, tenantId),
          eq(operationsPurchaseOrderItems.purchaseOrderId, purchaseOrderId),
        ),
      )
      .orderBy(
        asc(operationsPurchaseOrderItems.sortOrder),
        asc(operationsPurchaseOrderItems.id),
      );
  }

  async findActor(tenantId: string, userId: string) {
    const [row] = await db
      .select({
        firstName: sql<string>`coalesce(${hrEmployees.firstName}, ${users.firstName})`,
        lastName: sql<string>`coalesce(${hrEmployees.lastName}, ${users.lastName})`,
        role: users.role,
        passwordHash: users.passwordHash,
      })
      .from(users)
      .leftJoin(
        hrEmployees,
        and(eq(hrEmployees.userId, users.id), eq(hrEmployees.tenantId, tenantId)),
      )
      .where(and(eq(users.id, userId), eq(users.organizationId, tenantId)))
      .limit(1);
    return row;
  }

  async create(
    header: typeof operationsPurchaseOrders.$inferInsert,
    items: NewOperationsPurchaseOrderItem[],
  ) {
    return db.transaction(async (tx) => {
      const [created] = await tx
        .insert(operationsPurchaseOrders)
        .values(header)
        .returning({ id: operationsPurchaseOrders.id });
      if (!created) throw new Error('MISSING_PO');
      if (items.length) {
        await tx.insert(operationsPurchaseOrderItems).values(
          items.map((item) => ({ ...item, purchaseOrderId: created.id })),
        );
      }
      return created;
    });
  }

  async update(
    tenantId: string,
    id: string,
    header: Partial<typeof operationsPurchaseOrders.$inferInsert>,
    items: NewOperationsPurchaseOrderItem[],
  ) {
    return db.transaction(async (tx) => {
      const [updated] = await tx
        .update(operationsPurchaseOrders)
        .set({ ...header, updatedAt: new Date() })
        .where(
          and(
            eq(operationsPurchaseOrders.tenantId, tenantId),
            eq(operationsPurchaseOrders.id, id),
            isNull(operationsPurchaseOrders.deletedAt),
          ),
        )
        .returning({ id: operationsPurchaseOrders.id });
      if (!updated) return undefined;
      await tx
        .delete(operationsPurchaseOrderItems)
        .where(
          and(
            eq(operationsPurchaseOrderItems.tenantId, tenantId),
            eq(operationsPurchaseOrderItems.purchaseOrderId, id),
          ),
        );
      if (items.length) await tx.insert(operationsPurchaseOrderItems).values(items);
      return updated;
    });
  }

  async purge(tenantId: string, id: string) {
    const [removed] = await db
      .update(operationsPurchaseOrders)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(operationsPurchaseOrders.tenantId, tenantId),
          eq(operationsPurchaseOrders.id, id),
          isNull(operationsPurchaseOrders.deletedAt),
        ),
      )
      .returning({ id: operationsPurchaseOrders.id });
    return removed;
  }
}
