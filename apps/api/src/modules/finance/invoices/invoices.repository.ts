import { Injectable } from '@nestjs/common';
import { and, desc, eq, ilike, or, sql, type SQL } from 'drizzle-orm';

import {
  db,
  financeInvoiceItems,
  financeInvoices,
  financePayments,
  operationsDeliveryOrderItems,
  operationsDeliveryOrders,
  type NewFinanceInvoice,
  type NewFinanceInvoiceItem,
  type NewFinancePayment,
} from '@erp/db';

@Injectable()
export class InvoicesRepository {
  async list(
    tenantId: string,
    filters: { search?: string; status?: NewFinanceInvoice['status'] },
  ) {
    const conditions: SQL[] = [eq(financeInvoices.tenantId, tenantId)];
    if (filters.status) conditions.push(eq(financeInvoices.status, filters.status));
    if (filters.search?.trim()) {
      const pattern = `%${filters.search.trim()}%`;
      const search = or(
        ilike(financeInvoices.invoiceNumber, pattern),
        ilike(financeInvoices.customerName, pattern),
        ilike(operationsDeliveryOrders.deliveryNumber, pattern),
      );
      if (search) conditions.push(search);
    }

    return db
      .select({
        id: financeInvoices.id,
        invoiceNumber: financeInvoices.invoiceNumber,
        deliveryOrderId: financeInvoices.deliveryOrderId,
        deliveryNumber: operationsDeliveryOrders.deliveryNumber,
        customerName: financeInvoices.customerName,
        invoiceDate: financeInvoices.invoiceDate,
        subtotalAmount: financeInvoices.subtotalAmount,
        vatAmount: financeInvoices.vatAmount,
        totalAmount: financeInvoices.totalAmount,
        paidAmount: financeInvoices.paidAmount,
        status: financeInvoices.status,
        createdAt: financeInvoices.createdAt,
      })
      .from(financeInvoices)
      .innerJoin(
        operationsDeliveryOrders,
        eq(operationsDeliveryOrders.id, financeInvoices.deliveryOrderId),
      )
      .where(and(...conditions))
      .orderBy(desc(financeInvoices.createdAt));
  }

  async summary(tenantId: string) {
    const [row] = await db
      .select({
        unpaid: sql<number>`coalesce(sum(case when ${financeInvoices.status}::text = 'UNPAID' then 1 else 0 end), 0)::int`,
        partial: sql<number>`coalesce(sum(case when ${financeInvoices.status}::text = 'PARTIAL' then 1 else 0 end), 0)::int`,
        paid: sql<number>`coalesce(sum(case when ${financeInvoices.status}::text = 'PAID' then 1 else 0 end), 0)::int`,
        outstanding: sql<string>`coalesce(sum(case when ${financeInvoices.status}::text in ('UNPAID', 'PARTIAL') then (${financeInvoices.totalAmount}::numeric - ${financeInvoices.paidAmount}::numeric) else 0 end), 0)::numeric`,
      })
      .from(financeInvoices)
      .where(eq(financeInvoices.tenantId, tenantId));
    return row ?? { unpaid: 0, partial: 0, paid: 0, outstanding: '0' };
  }

  async findById(tenantId: string, id: string) {
    const [invoice] = await db
      .select({
        id: financeInvoices.id,
        invoiceNumber: financeInvoices.invoiceNumber,
        deliveryOrderId: financeInvoices.deliveryOrderId,
        deliveryNumber: operationsDeliveryOrders.deliveryNumber,
        customerName: financeInvoices.customerName,
        invoiceDate: financeInvoices.invoiceDate,
        subtotalAmount: financeInvoices.subtotalAmount,
        vatAmount: financeInvoices.vatAmount,
        totalAmount: financeInvoices.totalAmount,
        paidAmount: financeInvoices.paidAmount,
        status: financeInvoices.status,
        createdAt: financeInvoices.createdAt,
      })
      .from(financeInvoices)
      .innerJoin(
        operationsDeliveryOrders,
        eq(operationsDeliveryOrders.id, financeInvoices.deliveryOrderId),
      )
      .where(
        and(eq(financeInvoices.tenantId, tenantId), eq(financeInvoices.id, id)),
      )
      .limit(1);
    if (!invoice) return undefined;

    const items = await db
      .select()
      .from(financeInvoiceItems)
      .where(eq(financeInvoiceItems.invoiceId, id));
    const payments = await db
      .select()
      .from(financePayments)
      .where(eq(financePayments.invoiceId, id))
      .orderBy(desc(financePayments.paidAt));

    return { ...invoice, items, payments };
  }

  async findByDeliveryOrder(tenantId: string, deliveryOrderId: string) {
    const [row] = await db
      .select({ id: financeInvoices.id })
      .from(financeInvoices)
      .where(
        and(
          eq(financeInvoices.tenantId, tenantId),
          eq(financeInvoices.deliveryOrderId, deliveryOrderId),
        ),
      )
      .limit(1);
    return row;
  }

  async getDeliveryOrderForInvoice(tenantId: string, deliveryOrderId: string) {
    const [order] = await db
      .select()
      .from(operationsDeliveryOrders)
      .where(
        and(
          eq(operationsDeliveryOrders.tenantId, tenantId),
          eq(operationsDeliveryOrders.id, deliveryOrderId),
        ),
      )
      .limit(1);
    if (!order) return undefined;

    const items = await db
      .select()
      .from(operationsDeliveryOrderItems)
      .where(eq(operationsDeliveryOrderItems.deliveryOrderId, deliveryOrderId));

    return { order, items };
  }

  async latestNumber(tenantId: string, year: number): Promise<string | undefined> {
    const prefix = `INV-${year}-`;
    const [row] = await db
      .select({ invoiceNumber: financeInvoices.invoiceNumber })
      .from(financeInvoices)
      .where(
        and(
          eq(financeInvoices.tenantId, tenantId),
          sql`${financeInvoices.invoiceNumber} like ${`${prefix}%`}`,
        ),
      )
      .orderBy(desc(financeInvoices.invoiceNumber))
      .limit(1);
    return row?.invoiceNumber;
  }

  async create(input: {
    invoice: NewFinanceInvoice;
    items: NewFinanceInvoiceItem[];
  }) {
    return db.transaction(async (tx) => {
      const [invoice] = await tx
        .insert(financeInvoices)
        .values(input.invoice)
        .returning({
          id: financeInvoices.id,
          invoiceNumber: financeInvoices.invoiceNumber,
        });
      if (input.items.length > 0) {
        await tx.insert(financeInvoiceItems).values(
          input.items.map((item) => ({ ...item, invoiceId: invoice.id })),
        );
      }
      return invoice;
    });
  }

  async recordPayment(
    tenantId: string,
    invoiceId: string,
    payment: Omit<NewFinancePayment, 'tenantId' | 'invoiceId'>,
    paidAmount: string,
    status: NewFinanceInvoice['status'],
  ) {
    return db.transaction(async (tx) => {
      const [created] = await tx
        .insert(financePayments)
        .values({
          ...payment,
          tenantId,
          invoiceId,
        })
        .returning();
      await tx
        .update(financeInvoices)
        .set({
          paidAmount,
          status,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(financeInvoices.tenantId, tenantId),
            eq(financeInvoices.id, invoiceId),
          ),
        );
      return created;
    });
  }
}
