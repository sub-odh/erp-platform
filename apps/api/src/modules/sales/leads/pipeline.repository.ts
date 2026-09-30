import { Injectable } from '@nestjs/common';
import { and, asc, desc, eq, isNull, sql } from 'drizzle-orm';

import {
  db,
  financeInvoices,
  hrEmployees,
  operationsDeliveryOrders,
  salesCustomers,
  salesLeads,
  salesQuotations,
} from '@erp/db';

import type { PipelineQueryDto } from './pipeline.dto';

@Injectable()
export class PipelineRepository {
  async list(tenantId: string, query: PipelineQueryDto, userId: string) {
    const assignedName = sql<string>`coalesce(nullif(trim(concat(${hrEmployees.firstName}, ' ', ${hrEmployees.lastName})), ''), 'Unassigned')`;
    const stageOrder = sql`case ${salesLeads.stage}
      when 'Discovery' then 1 when 'Qualification' then 2 when 'Proposal' then 3
      when 'Negotiation' then 4 when 'Closing' then 5 when 'Won' then 6 when 'Lost' then 7 else 0 end`;
    const weighted = sql`(${salesLeads.dealValue} * (case ${salesLeads.stage}
      when 'Discovery' then 0.15 when 'Qualification' then 0.30 when 'Proposal' then 0.45
      when 'Negotiation' then 0.65 when 'Closing' then 0.80 when 'Won' then 1 else 0 end))`;
    const direction = query.direction === 'asc' ? asc : desc;
    const sort = {
      date: salesLeads.createdAt,
      company: salesLeads.companyName,
      project: salesLeads.projectTitle,
      stage: stageOrder,
      deal_val: salesLeads.dealValue,
      weighted,
      assigned: hrEmployees.firstName,
      id: salesLeads.createdAt,
    }[query.sort ?? 'id'];
    const mine =
      query.view === 'my'
        ? sql`(${hrEmployees.userId} = ${userId} OR ${salesLeads.createdBy} = ${userId})`
        : undefined;
    return db
      .select({
        id: salesLeads.id,
        createdAt: salesLeads.createdAt,
        companyName: salesLeads.companyName,
        projectTitle: salesLeads.projectTitle,
        contactPerson: salesLeads.contactPerson,
        phone: salesLeads.phone,
        email: salesLeads.email,
        stage: salesLeads.stage,
        dealValue: salesLeads.dealValue,
        assignedName,
        quotationId: sql<string | null>`(
          select q.id from sales_quotations q
          where q.lead_id = ${salesLeads.id} and q.deleted_at is null
          order by q.created_at desc limit 1
        )`,
      })
      .from(salesLeads)
      .leftJoin(hrEmployees, eq(hrEmployees.id, salesLeads.assignedEmployeeId))
      .where(
        and(
          eq(salesLeads.tenantId, tenantId),
          isNull(salesLeads.deletedAt),
          mine,
        ),
      )
      .orderBy(direction(sort));
  }

  async findEmployeeForUser(tenantId: string, userId: string) {
    const [row] = await db
      .select({ id: hrEmployees.id })
      .from(hrEmployees)
      .where(and(eq(hrEmployees.tenantId, tenantId), eq(hrEmployees.userId, userId)))
      .limit(1);
    return row;
  }

  async findCustomer(tenantId: string, id: string) {
    const [row] = await db
      .select({
        id: salesCustomers.id,
        name: salesCustomers.name,
        contactPerson: salesCustomers.contactPerson,
        phone: salesCustomers.phone,
        email: salesCustomers.email,
      })
      .from(salesCustomers)
      .where(and(eq(salesCustomers.tenantId, tenantId), eq(salesCustomers.id, id)))
      .limit(1);
    return row;
  }

  async insertCustomer(values: typeof salesCustomers.$inferInsert) {
    const [row] = await db.insert(salesCustomers).values(values).returning({ id: salesCustomers.id });
    return row;
  }

  async insertLead(values: typeof salesLeads.$inferInsert) {
    const [row] = await db.insert(salesLeads).values(values).returning({ id: salesLeads.id });
    return row;
  }

  async findLead(tenantId: string, id: string) {
    const [row] = await db
      .select({
        lead: salesLeads,
        assignedFirstName: hrEmployees.firstName,
        assignedLastName: hrEmployees.lastName,
        assignedUserId: hrEmployees.userId,
      })
      .from(salesLeads)
      .leftJoin(hrEmployees, eq(hrEmployees.id, salesLeads.assignedEmployeeId))
      .where(and(eq(salesLeads.tenantId, tenantId), eq(salesLeads.id, id), isNull(salesLeads.deletedAt)))
      .limit(1);
    return row;
  }

  async employees(tenantId: string) {
    return db
      .select({
        id: hrEmployees.id,
        firstName: hrEmployees.firstName,
        lastName: hrEmployees.lastName,
      })
      .from(hrEmployees)
      .where(eq(hrEmployees.tenantId, tenantId))
      .orderBy(asc(hrEmployees.firstName))
      .limit(300);
  }

  async quotations(tenantId: string, leadId: string) {
    return db
      .select({
        id: salesQuotations.id,
        quotationNumber: salesQuotations.quotationNumber,
        totalAmount: salesQuotations.totalAmount,
        currency: salesQuotations.currency,
        isFinal: salesQuotations.isFinal,
        createdAt: salesQuotations.createdAt,
      })
      .from(salesQuotations)
      .where(
        and(
          eq(salesQuotations.tenantId, tenantId),
          eq(salesQuotations.leadId, leadId),
          isNull(salesQuotations.deletedAt),
        ),
      )
      .orderBy(desc(salesQuotations.createdAt));
  }

  async deliveryOrders(tenantId: string, leadId: string) {
    return db
      .select({
        id: operationsDeliveryOrders.id,
        deliveryNumber: operationsDeliveryOrders.deliveryNumber,
        deliveryDate: operationsDeliveryOrders.deliveryDate,
        invoiceId: financeInvoices.id,
        invoiceNumber: financeInvoices.invoiceNumber,
        createdAt: operationsDeliveryOrders.createdAt,
      })
      .from(operationsDeliveryOrders)
      .leftJoin(
        financeInvoices,
        eq(financeInvoices.deliveryOrderId, operationsDeliveryOrders.id),
      )
      .where(
        and(
          eq(operationsDeliveryOrders.tenantId, tenantId),
          eq(operationsDeliveryOrders.leadId, leadId),
        ),
      )
      .orderBy(desc(operationsDeliveryOrders.createdAt));
  }

  async updateLead(tenantId: string, id: string, values: Partial<typeof salesLeads.$inferInsert>) {
    const [row] = await db
      .update(salesLeads)
      .set({ ...values, updatedAt: new Date() })
      .where(and(eq(salesLeads.tenantId, tenantId), eq(salesLeads.id, id)))
      .returning({ id: salesLeads.id });
    return row;
  }

  async markFinal(tenantId: string, leadId: string, quotationId: string) {
    await db
      .update(salesQuotations)
      .set({ isFinal: 0 })
      .where(and(eq(salesQuotations.tenantId, tenantId), eq(salesQuotations.leadId, leadId)));
    const [row] = await db
      .update(salesQuotations)
      .set({ isFinal: 1 })
      .where(
        and(
          eq(salesQuotations.tenantId, tenantId),
          eq(salesQuotations.leadId, leadId),
          eq(salesQuotations.id, quotationId),
        ),
      )
      .returning({ id: salesQuotations.id });
    return row;
  }

  async purge(tenantId: string, id: string) {
    const [row] = await db
      .delete(salesLeads)
      .where(and(eq(salesLeads.tenantId, tenantId), eq(salesLeads.id, id)))
      .returning({ id: salesLeads.id });
    return row;
  }
}
