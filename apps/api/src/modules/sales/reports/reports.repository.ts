import { Injectable } from '@nestjs/common';
import { and, eq, gte, inArray, isNull, lte, ne, sql } from 'drizzle-orm';

import {
  db,
  financeInvoices,
  financePayments,
  hrEmployees,
  operationsDeliveryOrderItems,
  operationsDeliveryOrders,
  salesLeads,
} from '@erp/db';

@Injectable()
export class ReportsRepository {
  invoiceFacts(tenantId: string, start: string, end: string) {
    return db
      .select({
        invoiceDate: financeInvoices.invoiceDate,
        totalAmount: financeInvoices.totalAmount,
        employeeId: hrEmployees.id,
        firstName: hrEmployees.firstName,
        salesTarget: hrEmployees.salesTarget,
        targetStartDate: hrEmployees.targetStartDate,
        targetEndDate: hrEmployees.targetEndDate,
      })
      .from(financeInvoices)
      .innerJoin(
        operationsDeliveryOrders,
        eq(operationsDeliveryOrders.id, financeInvoices.deliveryOrderId),
      )
      .leftJoin(hrEmployees, eq(hrEmployees.id, operationsDeliveryOrders.soldById))
      .where(
        and(
          eq(financeInvoices.tenantId, tenantId),
          gte(financeInvoices.invoiceDate, start),
          lte(financeInvoices.invoiceDate, end),
          ne(operationsDeliveryOrders.status, 'Cancelled'),
          ne(financeInvoices.status, 'VOID'),
        ),
      );
  }

  wonFacts(tenantId: string, start: Date, end: Date) {
    return db
      .select({
        updatedAt: salesLeads.updatedAt,
        dealValue: salesLeads.dealValue,
        employeeId: hrEmployees.id,
        firstName: hrEmployees.firstName,
        salesTarget: hrEmployees.salesTarget,
        targetStartDate: hrEmployees.targetStartDate,
        targetEndDate: hrEmployees.targetEndDate,
        hasSalesTarget: hrEmployees.hasSalesTarget,
      })
      .from(salesLeads)
      .leftJoin(hrEmployees, eq(hrEmployees.id, salesLeads.assignedEmployeeId))
      .where(
        and(
          eq(salesLeads.tenantId, tenantId),
          eq(salesLeads.stage, 'Won'),
          isNull(salesLeads.deletedAt),
          gte(salesLeads.updatedAt, start),
          lte(salesLeads.updatedAt, end),
        ),
      );
  }

  targetedEmployees(tenantId: string) {
    return db
      .select({
        id: hrEmployees.id,
        firstName: hrEmployees.firstName,
        salesTarget: hrEmployees.salesTarget,
        targetStartDate: hrEmployees.targetStartDate,
        targetEndDate: hrEmployees.targetEndDate,
      })
      .from(hrEmployees)
      .where(and(eq(hrEmployees.tenantId, tenantId), eq(hrEmployees.hasSalesTarget, true)));
  }

  invoiceLines(tenantId: string, employeeId: string, start: string, end: string) {
    return db
      .select({
        id: operationsDeliveryOrders.id,
        deliveryDate: operationsDeliveryOrders.deliveryDate,
        customerName: operationsDeliveryOrders.customerName,
        deliveryNumber: operationsDeliveryOrders.deliveryNumber,
        grandTotal: operationsDeliveryOrders.grandTotal,
        itemName: operationsDeliveryOrderItems.itemName,
        quantity: operationsDeliveryOrderItems.quantity,
      })
      .from(operationsDeliveryOrders)
      .innerJoin(
        financeInvoices,
        eq(financeInvoices.deliveryOrderId, operationsDeliveryOrders.id),
      )
      .leftJoin(
        operationsDeliveryOrderItems,
        eq(operationsDeliveryOrderItems.deliveryOrderId, operationsDeliveryOrders.id),
      )
      .where(
        and(
          eq(operationsDeliveryOrders.tenantId, tenantId),
          eq(operationsDeliveryOrders.soldById, employeeId),
          gte(operationsDeliveryOrders.deliveryDate, start),
          lte(operationsDeliveryOrders.deliveryDate, end),
          ne(operationsDeliveryOrders.status, 'Cancelled'),
          ne(financeInvoices.status, 'VOID'),
        ),
      );
  }

  wonLines(tenantId: string, employeeId: string, start: Date, end: Date) {
    return db
      .select({
        updatedAt: salesLeads.updatedAt,
        companyName: salesLeads.companyName,
        contactPerson: salesLeads.contactPerson,
        dealValue: salesLeads.dealValue,
        dealRemarks: salesLeads.dealRemarks,
      })
      .from(salesLeads)
      .where(
        and(
          eq(salesLeads.tenantId, tenantId),
          eq(salesLeads.assignedEmployeeId, employeeId),
          eq(salesLeads.stage, 'Won'),
          isNull(salesLeads.deletedAt),
          gte(salesLeads.updatedAt, start),
          lte(salesLeads.updatedAt, end),
        ),
      );
  }

  activeTargetEmployees(tenantId: string) {
    return db
      .select({
        id: hrEmployees.id,
        employeeCode: hrEmployees.employeeCode,
        firstName: hrEmployees.firstName,
        lastName: hrEmployees.lastName,
        photoUrl: hrEmployees.photoUrl,
        designation: hrEmployees.designation,
        department: hrEmployees.department,
        salesTarget: hrEmployees.salesTarget,
        yearlySalesTarget: hrEmployees.yearlySalesTarget,
        targetStartDate: hrEmployees.targetStartDate,
        targetEndDate: hrEmployees.targetEndDate,
        userId: hrEmployees.userId,
      })
      .from(hrEmployees)
      .where(
        and(
          eq(hrEmployees.tenantId, tenantId),
          eq(hrEmployees.hasSalesTarget, true),
          eq(hrEmployees.status, 'ACTIVE'),
        ),
      );
  }

  findEmployeeForUser(tenantId: string, userId: string) {
    return db
      .select({ id: hrEmployees.id })
      .from(hrEmployees)
      .where(and(eq(hrEmployees.tenantId, tenantId), eq(hrEmployees.userId, userId)))
      .limit(1);
  }

  findEmployeeWindow(tenantId: string, employeeId: string) {
    return db
      .select({
        id: hrEmployees.id,
        targetStartDate: hrEmployees.targetStartDate,
        targetEndDate: hrEmployees.targetEndDate,
        userId: hrEmployees.userId,
      })
      .from(hrEmployees)
      .where(and(eq(hrEmployees.tenantId, tenantId), eq(hrEmployees.id, employeeId)))
      .limit(1);
  }

  recoveries(tenantId: string, employeeIds: string[]) {
    if (employeeIds.length === 0) return Promise.resolve([]);
    const paidOn = sql<string>`to_char(${financePayments.paidAt} at time zone 'Asia/Kathmandu', 'YYYY-MM-DD')`;
    return db
      .select({
        employeeId: operationsDeliveryOrders.soldById,
        amount: financePayments.amount,
        method: financePayments.method,
        paidOn,
        invoiceDate: financeInvoices.invoiceDate,
        deliveryNumber: operationsDeliveryOrders.deliveryNumber,
        deliveryOrderId: operationsDeliveryOrders.id,
      })
      .from(financePayments)
      .innerJoin(financeInvoices, eq(financeInvoices.id, financePayments.invoiceId))
      .innerJoin(
        operationsDeliveryOrders,
        eq(operationsDeliveryOrders.id, financeInvoices.deliveryOrderId),
      )
      .where(
        and(
          eq(financePayments.tenantId, tenantId),
          inArray(operationsDeliveryOrders.soldById, employeeIds),
          eq(operationsDeliveryOrders.isVoided, 0),
        ),
      );
  }
}
