import { Injectable } from '@nestjs/common';
import { and, asc, desc, eq, gte, inArray, isNull, or, sql } from 'drizzle-orm';

import {
  db,
  financeInvoices,
  financePayments,
  hrEmployees,
  hrFieldVisits,
  hrLeaveRequests,
  hrMemos,
  hrPartnerAssignments,
  hrPartners,
  inventoryAssets,
  operationsDeliveryOrderItems,
  operationsDeliveryOrders,
  salesLeads,
  salesOpportunities,
} from '@erp/db';

@Injectable()
export class DashboardRepository {
  async findEmployee(tenantId: string, userId: string) {
    const [employee] = await db
      .select()
      .from(hrEmployees)
      .where(
        and(eq(hrEmployees.tenantId, tenantId), eq(hrEmployees.userId, userId)),
      )
      .limit(1);

    return employee;
  }

  pendingSubstitutions(tenantId: string, employeeId: string, today: string) {
    const requester = hrEmployees;

    return db
      .select({
        id: hrLeaveRequests.id,
        firstName: requester.firstName,
        lastName: requester.lastName,
        startDate: hrLeaveRequests.startDate,
        endDate: hrLeaveRequests.endDate,
      })
      .from(hrLeaveRequests)
      .innerJoin(requester, eq(hrLeaveRequests.employeeId, requester.id))
      .where(
        and(
          eq(hrLeaveRequests.tenantId, tenantId),
          eq(hrLeaveRequests.substituteId, employeeId),
          eq(hrLeaveRequests.peerVouched, false),
          gte(hrLeaveRequests.endDate, today),
          eq(hrLeaveRequests.status, 'PENDING'),
        ),
      )
      .orderBy(desc(hrLeaveRequests.createdAt));
  }

  async leavesToday(tenantId: string, today: string) {
    const [row] = await db
      .select({
        total: sql<number>`count(*)::int`,
      })
      .from(hrLeaveRequests)
      .where(
        and(
          eq(hrLeaveRequests.tenantId, tenantId),
          sql`${today}::date between ${hrLeaveRequests.startDate} and ${hrLeaveRequests.endDate}`,
          or(
            eq(hrLeaveRequests.status, 'APPROVED'),
            and(
              eq(hrLeaveRequests.status, 'PENDING'),
              eq(hrLeaveRequests.peerVouched, true),
            ),
          ),
        ),
      );

    return row?.total ?? 0;
  }

  async activeVisitId(tenantId: string, employeeId: string, today: string) {
    const [row] = await db
      .select({ id: hrFieldVisits.id })
      .from(hrFieldVisits)
      .where(
        and(
          eq(hrFieldVisits.tenantId, tenantId),
          eq(hrFieldVisits.employeeId, employeeId),
          eq(hrFieldVisits.visitDate, today),
          sql`nullif(${hrFieldVisits.inTime}, '') is null`,
        ),
      )
      .limit(1);

    return row?.id ?? null;
  }

  todayVisits(tenantId: string, today: string) {
    return db
      .select({
        id: hrFieldVisits.id,
        employeeId: hrFieldVisits.employeeId,
        firstName: hrEmployees.firstName,
        lastName: hrEmployees.lastName,
        agenda: hrFieldVisits.agenda,
        visitType: hrFieldVisits.visitType,
        inTime: hrFieldVisits.inTime,
        outTime: hrFieldVisits.outTime,
        remarks: hrFieldVisits.remarks,
      })
      .from(hrFieldVisits)
      .innerJoin(hrEmployees, eq(hrFieldVisits.employeeId, hrEmployees.id))
      .where(
        and(
          eq(hrFieldVisits.tenantId, tenantId),
          eq(hrFieldVisits.visitDate, today),
        ),
      )
      .orderBy(
        sql`nullif(${hrFieldVisits.inTime}, '') is null desc`,
        desc(hrFieldVisits.outTime),
      );
  }

  async markBack(
    tenantId: string,
    employeeId: string,
    visitId: string,
    remarks: string,
    inTime: string,
  ) {
    const updated = await db
      .update(hrFieldVisits)
      .set({ inTime, remarks, updatedAt: new Date() })
      .where(
        and(
          eq(hrFieldVisits.tenantId, tenantId),
          eq(hrFieldVisits.id, visitId),
          eq(hrFieldVisits.employeeId, employeeId),
          sql`nullif(${hrFieldVisits.inTime}, '') is null`,
        ),
      )
      .returning({ id: hrFieldVisits.id });

    return updated.length;
  }

  async confirmSubstitute(
    tenantId: string,
    employeeId: string,
    leaveId: string,
  ) {
    const updated = await db
      .update(hrLeaveRequests)
      .set({ peerVouched: true, updatedAt: new Date() })
      .where(
        and(
          eq(hrLeaveRequests.tenantId, tenantId),
          eq(hrLeaveRequests.id, leaveId),
          eq(hrLeaveRequests.substituteId, employeeId),
        ),
      )
      .returning({ id: hrLeaveRequests.id });

    return updated.length;
  }

  /*
   * PHP sets peer_vouched = 2. That column is a boolean here, so a decline
   * is stored as REJECTED and drops out of the pending (status 0) list.
   */
  async rejectSubstitute(
    tenantId: string,
    employeeId: string,
    leaveId: string,
  ) {
    const updated = await db
      .update(hrLeaveRequests)
      .set({ status: 'REJECTED', updatedAt: new Date() })
      .where(
        and(
          eq(hrLeaveRequests.tenantId, tenantId),
          eq(hrLeaveRequests.id, leaveId),
          eq(hrLeaveRequests.substituteId, employeeId),
        ),
      )
      .returning({ id: hrLeaveRequests.id });

    return updated.length;
  }

  async recoveredInMonth(tenantId: string, userId: string, month: string) {
    const [row] = await db
      .select({
        total: sql<string>`coalesce(sum(${financePayments.amount}::numeric), 0)::numeric`,
      })
      .from(financePayments)
      .innerJoin(
        financeInvoices,
        eq(financePayments.invoiceId, financeInvoices.id),
      )
      .innerJoin(
        operationsDeliveryOrders,
        eq(financeInvoices.deliveryOrderId, operationsDeliveryOrders.id),
      )
      .where(
        and(
          eq(financePayments.tenantId, tenantId),
          eq(operationsDeliveryOrders.deliveredBy, userId),
          sql`to_char(timezone('Asia/Kathmandu', ${financePayments.createdAt}), 'YYYY-MM') = ${month}`,
        ),
      );

    return Number(row?.total ?? 0);
  }

  async recoveredBetween(
    tenantId: string,
    userId: string,
    startDate: string,
    endDate: string,
  ) {
    const [row] = await db
      .select({
        total: sql<string>`coalesce(sum(${financePayments.amount}::numeric), 0)::numeric`,
      })
      .from(financePayments)
      .innerJoin(
        financeInvoices,
        eq(financePayments.invoiceId, financeInvoices.id),
      )
      .innerJoin(
        operationsDeliveryOrders,
        eq(financeInvoices.deliveryOrderId, operationsDeliveryOrders.id),
      )
      .where(
        and(
          eq(financePayments.tenantId, tenantId),
          eq(operationsDeliveryOrders.deliveredBy, userId),
          sql`timezone('Asia/Kathmandu', ${financePayments.createdAt})::date between ${startDate}::date and ${endDate}::date`,
        ),
      );

    return Number(row?.total ?? 0);
  }

  async wonDealsInMonth(tenantId: string, userId: string, month: string) {
    const [row] = await db
      .select({
        total: sql<string>`coalesce(sum(${salesOpportunities.amount}::numeric), 0)::numeric`,
      })
      .from(salesOpportunities)
      .innerJoin(salesLeads, eq(salesOpportunities.leadId, salesLeads.id))
      .where(
        and(
          eq(salesOpportunities.tenantId, tenantId),
          eq(salesLeads.ownerUserId, userId),
          eq(salesOpportunities.status, 'WON'),
          isNull(salesOpportunities.deletedAt),
          sql`to_char(timezone('Asia/Kathmandu', ${salesOpportunities.updatedAt}), 'YYYY-MM') = ${month}`,
        ),
      );

    return Number(row?.total ?? 0);
  }

  async invoicedForSeller(tenantId: string, userId: string, month: string) {
    const [row] = await db
      .select({
        total: sql<string>`coalesce(sum(${financeInvoices.totalAmount}::numeric), 0)::numeric`,
      })
      .from(financeInvoices)
      .innerJoin(
        operationsDeliveryOrders,
        eq(financeInvoices.deliveryOrderId, operationsDeliveryOrders.id),
      )
      .where(
        and(
          eq(financeInvoices.tenantId, tenantId),
          eq(operationsDeliveryOrders.deliveredBy, userId),
          sql`to_char(${financeInvoices.invoiceDate}::date, 'YYYY-MM') = ${month}`,
          sql`${financeInvoices.status}::text <> 'VOID'`,
        ),
      );

    return Number(row?.total ?? 0);
  }

  async availableInventory(tenantId: string) {
    const [row] = await db
      .select({ stock: sql<number>`count(*)::int` })
      .from(inventoryAssets)
      .where(
        and(
          eq(inventoryAssets.tenantId, tenantId),
          inArray(inventoryAssets.status, ['AVAILABLE', 'RETURNED']),
          isNull(inventoryAssets.deletedAt),
        ),
      );

    return row?.stock ?? 0;
  }

  async pendingMemos(tenantId: string) {
    const [row] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(hrMemos)
      .where(
        and(eq(hrMemos.tenantId, tenantId), eq(hrMemos.status, 'PENDING')),
      );

    return row?.total ?? 0;
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

  topDebtors(tenantId: string) {
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
          sql`sum(${financeInvoices.totalAmount}::numeric - ${financeInvoices.paidAmount}::numeric)`,
        ),
      )
      .limit(5);
  }

  deliveryTotalsByDay(tenantId: string, fromDate: string) {
    return db
      .select({
        day: operationsDeliveryOrders.deliveryDate,
        total: sql<string>`coalesce(sum(${operationsDeliveryOrderItems.quantity} * ${operationsDeliveryOrderItems.unitPrice}::numeric), 0)::numeric`,
      })
      .from(operationsDeliveryOrders)
      .innerJoin(
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

  deliveryTotalsByMonth(tenantId: string, fromMonth: string) {
    return db
      .select({
        month: sql<string>`to_char(${operationsDeliveryOrders.deliveryDate}::date, 'YYYY-MM')`,
        total: sql<string>`coalesce(sum(${operationsDeliveryOrderItems.quantity} * ${operationsDeliveryOrderItems.unitPrice}::numeric), 0)::numeric`,
      })
      .from(operationsDeliveryOrders)
      .innerJoin(
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
      .groupBy(
        sql`to_char(${operationsDeliveryOrders.deliveryDate}::date, 'YYYY-MM')`,
      );
  }

  async deliveryTotalInMonth(tenantId: string, month: string) {
    const [row] = await db
      .select({
        total: sql<string>`coalesce(sum(${operationsDeliveryOrderItems.quantity} * ${operationsDeliveryOrderItems.unitPrice}::numeric), 0)::numeric`,
      })
      .from(operationsDeliveryOrders)
      .innerJoin(
        operationsDeliveryOrderItems,
        eq(
          operationsDeliveryOrderItems.deliveryOrderId,
          operationsDeliveryOrders.id,
        ),
      )
      .where(
        and(
          eq(operationsDeliveryOrders.tenantId, tenantId),
          sql`to_char(${operationsDeliveryOrders.deliveryDate}::date, 'YYYY-MM') = ${month}`,
        ),
      );

    return Number(row?.total ?? 0);
  }

  assignedPartners(tenantId: string, employeeId: string) {
    return db
      .select({
        id: hrPartners.id,
        name: hrPartners.name,
        logoUrl: hrPartners.logoUrl,
        portalUrl: hrPartners.portalUrl,
        websiteUrl: hrPartners.websiteUrl,
      })
      .from(hrPartners)
      .innerJoin(
        hrPartnerAssignments,
        eq(hrPartnerAssignments.partnerId, hrPartners.id),
      )
      .where(
        and(
          eq(hrPartners.tenantId, tenantId),
          eq(hrPartnerAssignments.employeeId, employeeId),
        ),
      )
      .orderBy(asc(hrPartners.name));
  }
}
