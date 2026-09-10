import { Injectable } from '@nestjs/common';
import { and, desc, eq, gte, inArray, isNull, sql } from 'drizzle-orm';

import {
  db,
  financeInvoices,
  inventoryAssets,
  operationsDeliveryOrderItems,
  operationsDeliveryOrders,
  salesOpportunities,
} from '@erp/db';

@Injectable()
export class DashboardRepository {
  async availableInventory(tenantId: string) {
    const [row] = await db
      .select({
        stock: sql<number>`coalesce(sum(${inventoryAssets.stockQuantity}), 0)::int`,
      })
      .from(inventoryAssets)
      .where(
        and(
          eq(inventoryAssets.tenantId, tenantId),
          isNull(inventoryAssets.deletedAt),
        ),
      );
    return row?.stock ?? 0;
  }

  async outstandingDue(tenantId: string) {
    const [row] = await db
      .select({
        outstanding: sql<string>`coalesce(sum(${financeInvoices.totalAmount}::numeric - ${financeInvoices.paidAmount}::numeric), 0)::numeric`,
      })
      .from(financeInvoices)
      .where(
        and(
          eq(financeInvoices.tenantId, tenantId),
          inArray(financeInvoices.status, ['UNPAID', 'PARTIAL']),
        ),
      );
    return Number(row?.outstanding ?? 0);
  }

  async salesByDay(tenantId: string, fromDate: string) {
    return db
      .select({
        day: operationsDeliveryOrders.deliveryDate,
        total: sql<string>`coalesce(sum(${operationsDeliveryOrderItems.quantity} * ${operationsDeliveryOrderItems.unitPrice}), 0)::numeric`,
      })
      .from(operationsDeliveryOrders)
      .leftJoin(
        operationsDeliveryOrderItems,
        eq(
          operationsDeliveryOrderItems.deliveryOrderId,
          operationsDeliveryOrders.id,
        ),
      )
      .where(
        and(
          eq(operationsDeliveryOrders.tenantId, tenantId),
          gte(operationsDeliveryOrders.deliveryDate, fromDate),
        ),
      )
      .groupBy(operationsDeliveryOrders.deliveryDate);
  }

  async salesByMonth(tenantId: string, fromMonth: string) {
    return db
      .select({
        month: sql<string>`to_char(${operationsDeliveryOrders.deliveryDate}::date, 'YYYY-MM')`,
        total: sql<string>`coalesce(sum(${operationsDeliveryOrderItems.quantity} * ${operationsDeliveryOrderItems.unitPrice}), 0)::numeric`,
      })
      .from(operationsDeliveryOrders)
      .leftJoin(
        operationsDeliveryOrderItems,
        eq(
          operationsDeliveryOrderItems.deliveryOrderId,
          operationsDeliveryOrders.id,
        ),
      )
      .where(
        and(
          eq(operationsDeliveryOrders.tenantId, tenantId),
          sql`to_char(${operationsDeliveryOrders.deliveryDate}::date, 'YYYY-MM') >= ${fromMonth}`,
        ),
      )
      .groupBy(sql`to_char(${operationsDeliveryOrders.deliveryDate}::date, 'YYYY-MM')`);
  }

  async invoicedInMonth(tenantId: string, month: string) {
    const [row] = await db
      .select({
        total: sql<string>`coalesce(sum(${financeInvoices.totalAmount}::numeric), 0)::numeric`,
      })
      .from(financeInvoices)
      .where(
        and(
          eq(financeInvoices.tenantId, tenantId),
          sql`to_char(${financeInvoices.invoiceDate}::date, 'YYYY-MM') = ${month}`,
          sql`${financeInvoices.status}::text <> 'VOID'`,
        ),
      );
    return Number(row?.total ?? 0);
  }

  async invoicedInYear(tenantId: string, year: number) {
    const [row] = await db
      .select({
        total: sql<string>`coalesce(sum(${financeInvoices.totalAmount}::numeric), 0)::numeric`,
      })
      .from(financeInvoices)
      .where(
        and(
          eq(financeInvoices.tenantId, tenantId),
          sql`to_char(${financeInvoices.invoiceDate}::date, 'YYYY') = ${String(year)}`,
          sql`${financeInvoices.status}::text <> 'VOID'`,
        ),
      );
    return Number(row?.total ?? 0);
  }

  async wonDealsInMonth(tenantId: string, month: string) {
    const [row] = await db
      .select({
        total: sql<string>`coalesce(sum(${salesOpportunities.amount}::numeric), 0)::numeric`,
      })
      .from(salesOpportunities)
      .where(
        and(
          eq(salesOpportunities.tenantId, tenantId),
          eq(salesOpportunities.status, 'WON'),
          isNull(salesOpportunities.deletedAt),
          sql`to_char(coalesce(${salesOpportunities.closedAt}, ${salesOpportunities.createdAt}), 'YYYY-MM') = ${month}`,
        ),
      );
    return Number(row?.total ?? 0);
  }

  async invoiceDistribution(tenantId: string, month: string) {
    return db
      .select({
        status: financeInvoices.status,
        total: sql<string>`coalesce(sum(${financeInvoices.totalAmount}::numeric), 0)::numeric`,
      })
      .from(financeInvoices)
      .where(
        and(
          eq(financeInvoices.tenantId, tenantId),
          sql`to_char(${financeInvoices.invoiceDate}::date, 'YYYY-MM') = ${month}`,
          sql`${financeInvoices.status}::text <> 'VOID'`,
        ),
      )
      .groupBy(financeInvoices.status);
  }

  async topDebtors(tenantId: string) {
    return db
      .select({
        name: financeInvoices.customerName,
        totalDebt: sql<string>`coalesce(sum(${financeInvoices.totalAmount}::numeric - ${financeInvoices.paidAmount}::numeric), 0)::numeric`,
      })
      .from(financeInvoices)
      .where(
        and(
          eq(financeInvoices.tenantId, tenantId),
          inArray(financeInvoices.status, ['UNPAID', 'PARTIAL']),
        ),
      )
      .groupBy(financeInvoices.customerName)
      .orderBy(
        desc(
          sql`coalesce(sum(${financeInvoices.totalAmount}::numeric - ${financeInvoices.paidAmount}::numeric), 0)`,
        ),
      )
      .limit(5);
  }
}
