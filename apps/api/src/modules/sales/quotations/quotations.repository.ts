import { Injectable } from '@nestjs/common';
import { and, desc, eq, ilike, isNull, or, sql, type SQL } from 'drizzle-orm';

import {
  db,
  salesCustomers,
  salesQuotationItems,
  salesQuotations,
  type NewSalesQuotation,
  type NewSalesQuotationItem,
} from '@erp/db';

import { getPaginationOffset } from '../../../common/pagination';
import type { ListQuotationsQueryDto } from './dto/quotation.dto';

@Injectable()
export class QuotationsRepository {
  async list(input: ListQuotationsQueryDto & { tenantId: string }) {
    const conditions: SQL[] = [
      eq(salesQuotations.tenantId, input.tenantId),
      isNull(salesQuotations.deletedAt),
    ];
    if (input.search?.trim()) {
      const pattern = `%${input.search.trim()}%`;
      const search = or(
        ilike(salesQuotations.quotationNumber, pattern),
        ilike(salesCustomers.name, pattern),
        ilike(salesCustomers.customerCode, pattern),
      );
      if (search) conditions.push(search);
    }
    if (input.status) conditions.push(eq(salesQuotations.status, input.status));

    const [data, count] = await Promise.all([
      db
        .select({
          id: salesQuotations.id,
          quotationNumber: salesQuotations.quotationNumber,
          issueDate: salesQuotations.issueDate,
          expiryDate: salesQuotations.expiryDate,
          status: salesQuotations.status,
          subtotalAmount: salesQuotations.subtotalAmount,
          vatAmount: salesQuotations.vatAmount,
          totalAmount: salesQuotations.totalAmount,
          customerId: salesCustomers.id,
          customerName: salesCustomers.name,
          customerCode: salesCustomers.customerCode,
          createdAt: salesQuotations.createdAt,
        })
        .from(salesQuotations)
        .innerJoin(
          salesCustomers,
          eq(salesCustomers.id, salesQuotations.customerId),
        )
        .where(and(...conditions))
        .orderBy(
          desc(salesQuotations.issueDate),
          desc(salesQuotations.createdAt),
        )
        .limit(input.limit)
        .offset(getPaginationOffset(input)),
      db
        .select({ total: sql<number>`count(*)::int` })
        .from(salesQuotations)
        .innerJoin(
          salesCustomers,
          eq(salesCustomers.id, salesQuotations.customerId),
        )
        .where(and(...conditions)),
    ]);
    return { data, total: count[0]?.total ?? 0 };
  }

  async findDetails(tenantId: string, id: string) {
    const [quotation] = await db
      .select({
        id: salesQuotations.id,
        quotationNumber: salesQuotations.quotationNumber,
        issueDate: salesQuotations.issueDate,
        expiryDate: salesQuotations.expiryDate,
        status: salesQuotations.status,
        destinationAddress: salesQuotations.destinationAddress,
        terms: salesQuotations.terms,
        subtotalAmount: salesQuotations.subtotalAmount,
        vatAmount: salesQuotations.vatAmount,
        totalAmount: salesQuotations.totalAmount,
        customerId: salesCustomers.id,
        customerName: salesCustomers.name,
        customerCode: salesCustomers.customerCode,
        customerEmail: salesCustomers.email,
        createdAt: salesQuotations.createdAt,
      })
      .from(salesQuotations)
      .innerJoin(
        salesCustomers,
        eq(salesCustomers.id, salesQuotations.customerId),
      )
      .where(
        and(
          eq(salesQuotations.tenantId, tenantId),
          eq(salesQuotations.id, id),
          isNull(salesQuotations.deletedAt),
        ),
      )
      .limit(1);
    if (!quotation) return undefined;

    const items = await db
      .select({
        id: salesQuotationItems.id,
        itemName: salesQuotationItems.itemName,
        description: salesQuotationItems.description,
        quantity: salesQuotationItems.quantity,
        unitPrice: salesQuotationItems.unitPrice,
        lineTotal: salesQuotationItems.lineTotal,
      })
      .from(salesQuotationItems)
      .where(
        and(
          eq(salesQuotationItems.tenantId, tenantId),
          eq(salesQuotationItems.quotationId, id),
        ),
      )
      .orderBy(salesQuotationItems.sortOrder);
    return { ...quotation, items };
  }

  async findCustomer(tenantId: string, id: string) {
    const [customer] = await db
      .select({ id: salesCustomers.id })
      .from(salesCustomers)
      .where(
        and(
          eq(salesCustomers.tenantId, tenantId),
          eq(salesCustomers.id, id),
          eq(salesCustomers.isActive, true),
          isNull(salesCustomers.deletedAt),
        ),
      )
      .limit(1);
    return customer;
  }

  async latestNumber(tenantId: string, year: number) {
    const [row] = await db
      .select({ quotationNumber: salesQuotations.quotationNumber })
      .from(salesQuotations)
      .where(
        and(
          eq(salesQuotations.tenantId, tenantId),
          ilike(salesQuotations.quotationNumber, `QT-${year}-%`),
        ),
      )
      .orderBy(desc(salesQuotations.quotationNumber))
      .limit(1);
    return row?.quotationNumber;
  }

  async create(quotation: NewSalesQuotation, items: NewSalesQuotationItem[]) {
    return db.transaction(async (tx) => {
      const [created] = await tx
        .insert(salesQuotations)
        .values(quotation)
        .returning();
      if (!created) throw new Error('Database did not return the quotation');
      await tx.insert(salesQuotationItems).values(items);
      return created;
    });
  }

  async softDelete(tenantId: string, id: string, actorUserId: string) {
    const [deleted] = await db
      .update(salesQuotations)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
        updatedBy: actorUserId,
      })
      .where(
        and(
          eq(salesQuotations.tenantId, tenantId),
          eq(salesQuotations.id, id),
          isNull(salesQuotations.deletedAt),
        ),
      )
      .returning({ id: salesQuotations.id });
    return deleted;
  }
}
