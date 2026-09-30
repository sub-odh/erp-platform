import { Injectable } from '@nestjs/common';
import { and, asc, eq, inArray } from 'drizzle-orm';

import {
  db,
  financeInvoices,
  financePayments,
  organizations,
  salesCustomers,
  operationsDeliveryOrders,
  users,
} from '@erp/db';

@Injectable()
export class RecoveriesRepository {
  list(tenantId: string) {
    return db
      .select({
        id: operationsDeliveryOrders.id,
        deliveryNumber: operationsDeliveryOrders.deliveryNumber,
        customerName: operationsDeliveryOrders.customerName,
        createdAt: operationsDeliveryOrders.createdAt,
        isVoided: operationsDeliveryOrders.isVoided,
        balanceVoided: operationsDeliveryOrders.balanceVoided,
        recoveryNoticeDay: operationsDeliveryOrders.recoveryNoticeDay,
        invoiceId: financeInvoices.id,
        invoiceNumber: financeInvoices.invoiceNumber,
        totalAmount: financeInvoices.totalAmount,
        paidAmount: financeInvoices.paidAmount,
        invoiceStatus: financeInvoices.status,
        customerEmail: salesCustomers.email,
      })
      .from(operationsDeliveryOrders)
      .innerJoin(
        financeInvoices,
        eq(financeInvoices.deliveryOrderId, operationsDeliveryOrders.id),
      )
      .leftJoin(salesCustomers, eq(salesCustomers.id, operationsDeliveryOrders.customerId))
      .where(
        and(
          eq(operationsDeliveryOrders.tenantId, tenantId),
          eq(operationsDeliveryOrders.isBillable, 1),
        ),
      );
  }

  findOne(tenantId: string, id: string) {
    return db
      .select({
        id: operationsDeliveryOrders.id,
        deliveryNumber: operationsDeliveryOrders.deliveryNumber,
        customerName: operationsDeliveryOrders.customerName,
        createdAt: operationsDeliveryOrders.createdAt,
        isVoided: operationsDeliveryOrders.isVoided,
        balanceVoided: operationsDeliveryOrders.balanceVoided,
        invoiceId: financeInvoices.id,
        invoiceNumber: financeInvoices.invoiceNumber,
        invoiceDate: financeInvoices.invoiceDate,
        totalAmount: financeInvoices.totalAmount,
        paidAmount: financeInvoices.paidAmount,
        invoiceStatus: financeInvoices.status,
        customerEmail: salesCustomers.email,
        customerAddress: salesCustomers.address,
        customerPhone: salesCustomers.phone,
        customerTaxNumber: salesCustomers.taxNumber,
      })
      .from(operationsDeliveryOrders)
      .innerJoin(
        financeInvoices,
        eq(financeInvoices.deliveryOrderId, operationsDeliveryOrders.id),
      )
      .leftJoin(salesCustomers, eq(salesCustomers.id, operationsDeliveryOrders.customerId))
      .where(
        and(
          eq(operationsDeliveryOrders.tenantId, tenantId),
          eq(operationsDeliveryOrders.id, id),
        ),
      )
      .limit(1);
  }

  payments(tenantId: string, invoiceId: string) {
    return db
      .select({
        amount: financePayments.amount,
        method: financePayments.method,
        referenceNumber: financePayments.referenceNumber,
        paidAt: financePayments.paidAt,
      })
      .from(financePayments)
      .where(and(eq(financePayments.tenantId, tenantId), eq(financePayments.invoiceId, invoiceId)))
      .orderBy(asc(financePayments.paidAt));
  }

  company(tenantId: string) {
    return db
      .select({
        name: organizations.name,
        taxNumber: organizations.taxNumber,
        logoUrl: organizations.logoUrl,
        addressLine1: organizations.addressLine1,
        addressLine2: organizations.addressLine2,
        city: organizations.city,
      })
      .from(organizations)
      .where(eq(organizations.id, tenantId))
      .limit(1);
  }

  passwordHash(userId: string) {
    return db
      .select({ passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
  }

  recordPayment(
    tenantId: string,
    invoiceId: string,
    payment: {
      amount: string;
      method: 'CASH' | 'CHEQUE' | 'ONLINE';
      referenceNumber: string | null;
      paidAt: Date;
      recordedBy: string;
    },
    paidAmount: string,
    status: 'UNPAID' | 'PARTIAL' | 'PAID' | 'VOID',
  ) {
    return db.transaction(async (tx) => {
      await tx.insert(financePayments).values({
        tenantId,
        invoiceId,
        amount: payment.amount,
        method: payment.method,
        referenceNumber: payment.referenceNumber,
        paidAt: payment.paidAt,
        recordedBy: payment.recordedBy,
      });
      await tx
        .update(financeInvoices)
        .set({ paidAmount, status, updatedAt: new Date() })
        .where(and(eq(financeInvoices.tenantId, tenantId), eq(financeInvoices.id, invoiceId)));
    });
  }

  voidBalance(tenantId: string, id: string) {
    return db
      .update(operationsDeliveryOrders)
      .set({ balanceVoided: 1 })
      .where(and(eq(operationsDeliveryOrders.tenantId, tenantId), eq(operationsDeliveryOrders.id, id)))
      .returning({ id: operationsDeliveryOrders.id });
  }

  markNotice(tenantId: string, ids: string[], day: number) {
    if (ids.length === 0) return Promise.resolve();
    return db
      .update(operationsDeliveryOrders)
      .set({ recoveryNoticeDay: day })
      .where(
        and(
          eq(operationsDeliveryOrders.tenantId, tenantId),
          inArray(operationsDeliveryOrders.id, ids),
        ),
      );
  }

  markNoticeOne(tenantId: string, id: string, day: number) {
    return db
      .update(operationsDeliveryOrders)
      .set({ recoveryNoticeDay: day })
      .where(and(eq(operationsDeliveryOrders.tenantId, tenantId), eq(operationsDeliveryOrders.id, id)));
  }
}
