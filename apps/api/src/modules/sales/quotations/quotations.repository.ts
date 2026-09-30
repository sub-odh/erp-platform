import { Injectable } from '@nestjs/common';
import {
  and,
  asc,
  desc,
  eq,
  ilike,
  isNull,
  lt,
  or,
  sql,
  type SQL,
} from 'drizzle-orm';

import {
  db,
  hrEmployees,
  salesCustomers,
  salesLeads,
  salesQuotationItems,
  salesQuotations,
  users,
  type NewSalesQuotationItem,
} from '@erp/db';

import type { ListQuotationsQueryDto } from './dto/quotation.dto';

@Injectable()
export class QuotationsRepository {
  async list(tenantId: string, query: ListQuotationsQueryDto) {
    const customerName = sql<string>`coalesce(${salesQuotations.customerName}, ${salesCustomers.name}, '')`;
    const today = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kathmandu',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
    const conditions: SQL[] = [
      eq(salesQuotations.tenantId, tenantId),
      isNull(salesQuotations.deletedAt),
    ];
    const search = query.search?.trim();
    if (search) {
      const pattern = `%${search}%`;
      const match = or(
        ilike(salesQuotations.quotationNumber, pattern),
        ilike(customerName, pattern),
        ilike(salesLeads.companyName, pattern),
      );
      if (match) conditions.push(match);
    }
    if (query.status === 'expired') {
      conditions.push(lt(salesQuotations.expiryDate, today));
    }
    if (query.status === 'active') {
      conditions.push(sql`(${salesQuotations.expiryDate} >= ${today} OR ${salesQuotations.expiryDate} IS NULL)`);
    }
    const direction = query.direction === 'asc' ? asc : desc;
    const sortColumn = {
      quotation_number: salesQuotations.quotationNumber,
      quotation_date: salesQuotations.issueDate,
      expiry_date: salesQuotations.expiryDate,
      customer_name: customerName,
      total_amount: salesQuotations.totalAmount,
      lead: salesLeads.companyName,
    }[query.sort ?? 'quotation_date'];
    const creator = sql<string>`coalesce(nullif(trim(concat(${hrEmployees.firstName}, ' ', ${hrEmployees.lastName})), ''), ${users.email}, 'System Executive')`;
    return db
      .select({
        id: salesQuotations.id,
        quotationNumber: salesQuotations.quotationNumber,
        quotationDate: salesQuotations.issueDate,
        expiryDate: salesQuotations.expiryDate,
        customerName,
        totalAmount: salesQuotations.totalAmount,
        currency: salesQuotations.currency,
        leadId: salesQuotations.leadId,
        leadName: salesLeads.companyName,
        creatorName: creator,
      })
      .from(salesQuotations)
      .leftJoin(salesCustomers, eq(salesCustomers.id, salesQuotations.customerId))
      .leftJoin(salesLeads, eq(salesLeads.id, salesQuotations.leadId))
      .leftJoin(users, eq(users.id, salesQuotations.createdBy))
      .leftJoin(
        hrEmployees,
        and(
          eq(hrEmployees.userId, users.id),
          eq(hrEmployees.tenantId, salesQuotations.tenantId),
        ),
      )
      .where(and(...conditions))
      .orderBy(direction(sortColumn), desc(salesQuotations.id));
  }

  async metrics(tenantId: string) {
    const today = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kathmandu',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
    const [row] = await db
      .select({
        totalCount: sql<number>`count(*)::int`,
        pipelineGrossValue: sql<string>`coalesce(sum(${salesQuotations.totalAmount}), 0)`,
        expiredCount: sql<number>`count(*) filter (where ${salesQuotations.expiryDate} < ${today})::int`,
      })
      .from(salesQuotations)
      .where(
        and(
          eq(salesQuotations.tenantId, tenantId),
          isNull(salesQuotations.deletedAt),
        ),
      );
    return {
      totalCount: row?.totalCount ?? 0,
      pipelineGrossValue: row?.pipelineGrossValue ?? '0',
      expiredCount: row?.expiredCount ?? 0,
    };
  }

  async findHeader(tenantId: string, id: string) {
    const [row] = await db
      .select({
        id: salesQuotations.id,
        quotationNumber: salesQuotations.quotationNumber,
        quotationDate: salesQuotations.issueDate,
        expiryDate: salesQuotations.expiryDate,
        customerId: salesQuotations.customerId,
        customerName: sql<string>`coalesce(${salesQuotations.customerName}, ${salesCustomers.name}, '')`,
        customerAddress: sql<string>`coalesce(${salesQuotations.destinationAddress}, '')`,
        termsConditions: sql<string>`coalesce(${salesQuotations.terms}, '')`,
        totalAmount: salesQuotations.totalAmount,
        subtotalAmount: salesQuotations.subtotalAmount,
        vatAmount: salesQuotations.vatAmount,
        currency: salesQuotations.currency,
        vatApplicable: salesQuotations.vatApplicable,
        leadId: salesQuotations.leadId,
        leadName: salesLeads.companyName,
        createdAt: salesQuotations.createdAt,
        creatorName: sql<string>`coalesce(nullif(trim(concat(${hrEmployees.firstName}, ' ', ${hrEmployees.lastName})), ''), ${users.email}, 'System Executive')`,
        signatureUrl: sql<string | null>`coalesce(${hrEmployees.signatureUrl}, ${users.signatureUrl})`,
      })
      .from(salesQuotations)
      .leftJoin(salesCustomers, eq(salesCustomers.id, salesQuotations.customerId))
      .leftJoin(salesLeads, eq(salesLeads.id, salesQuotations.leadId))
      .leftJoin(users, eq(users.id, salesQuotations.createdBy))
      .leftJoin(
        hrEmployees,
        and(
          eq(hrEmployees.userId, users.id),
          eq(hrEmployees.tenantId, salesQuotations.tenantId),
        ),
      )
      .where(
        and(
          eq(salesQuotations.tenantId, tenantId),
          eq(salesQuotations.id, id),
          isNull(salesQuotations.deletedAt),
        ),
      )
      .limit(1);
    return row;
  }

  async findItems(tenantId: string, quotationId: string) {
    return db
      .select({
        id: salesQuotationItems.id,
        itemName: salesQuotationItems.itemName,
        description: salesQuotationItems.description,
        quantity: salesQuotationItems.quantity,
        unitPrice: salesQuotationItems.unitPrice,
      })
      .from(salesQuotationItems)
      .where(
        and(
          eq(salesQuotationItems.tenantId, tenantId),
          eq(salesQuotationItems.quotationId, quotationId),
        ),
      )
      .orderBy(asc(salesQuotationItems.sortOrder), asc(salesQuotationItems.id));
  }

  async findActor(tenantId: string, userId: string) {
    const [row] = await db
      .select({ passwordHash: users.passwordHash })
      .from(users)
      .where(and(eq(users.id, userId), eq(users.organizationId, tenantId)))
      .limit(1);
    return row;
  }

  async create(
    header: typeof salesQuotations.$inferInsert,
    items: NewSalesQuotationItem[],
  ) {
    return db.transaction(async (tx) => {
      const [created] = await tx
        .insert(salesQuotations)
        .values(header)
        .returning({ id: salesQuotations.id });
      if (!created) throw new Error('MISSING_QUOTATION');
      if (items.length) {
        await tx.insert(salesQuotationItems).values(
          items.map((item) => ({ ...item, quotationId: created.id })),
        );
      }
      return created;
    });
  }

  async update(
    tenantId: string,
    id: string,
    header: Partial<typeof salesQuotations.$inferInsert>,
    items: NewSalesQuotationItem[],
  ) {
    return db.transaction(async (tx) => {
      const [updated] = await tx
        .update(salesQuotations)
        .set({ ...header, updatedAt: new Date() })
        .where(
          and(
            eq(salesQuotations.tenantId, tenantId),
            eq(salesQuotations.id, id),
            isNull(salesQuotations.deletedAt),
          ),
        )
        .returning({ id: salesQuotations.id });
      if (!updated) return undefined;
      await tx
        .delete(salesQuotationItems)
        .where(
          and(
            eq(salesQuotationItems.tenantId, tenantId),
            eq(salesQuotationItems.quotationId, id),
          ),
        );
      if (items.length) await tx.insert(salesQuotationItems).values(items);
      return updated;
    });
  }

  async purge(tenantId: string, id: string) {
    const [removed] = await db
      .delete(salesQuotations)
      .where(
        and(
          eq(salesQuotations.tenantId, tenantId),
          eq(salesQuotations.id, id),
        ),
      )
      .returning({ id: salesQuotations.id });
    return removed;
  }
}
