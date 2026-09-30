import { Injectable } from '@nestjs/common';
import {
  and,
  asc,
  desc,
  eq,
  gte,
  ilike,
  lte,
  or,
  sql,
  type SQL,
} from 'drizzle-orm';

import {
  db,
  hrEmployees,
  salesProformaInvoices,
  salesProformaItems,
  users,
  type NewSalesProformaItem,
} from '@erp/db';

import type { ListProformaInvoicesQueryDto } from './dto/proforma-invoice.dto';

export interface ProformaActor {
  firstName: string;
  lastName: string;
  role: string;
  signatureUrl: string | null;
  passwordHash: string;
}

export interface ProformaHeaderInput {
  tenantId: string;
  sequence: number;
  piNumber: string;
  piDate: string;
  customerDetails: string;
  billTo: string;
  shipTo: string;
  termsConditions: string | null;
  totalAmount: string;
  currency: string;
  createdBy: string;
}

@Injectable()
export class ProformaInvoicesRepository {
  async nextSequence(tenantId: string): Promise<number> {
    const [row] = await db
      .select({
        max: sql<number>`coalesce(max(${salesProformaInvoices.sequence}), 0)::int`,
      })
      .from(salesProformaInvoices)
      .where(eq(salesProformaInvoices.tenantId, tenantId));
    return (row?.max ?? 0) + 1;
  }

  async list(tenantId: string, query: ListProformaInvoicesQueryDto) {
    const conditions: SQL[] = [eq(salesProformaInvoices.tenantId, tenantId)];
    const customer = query.searchCustomer?.trim();
    if (customer) {
      const pattern = `%${customer}%`;
      const match = or(
        ilike(salesProformaInvoices.customerDetails, pattern),
        ilike(salesProformaInvoices.billTo, pattern),
      );
      if (match) conditions.push(match);
    }
    const number = query.searchPiNum?.trim();
    if (number) {
      conditions.push(ilike(salesProformaInvoices.piNumber, `%${number}%`));
    }
    if (query.startDate) {
      conditions.push(gte(salesProformaInvoices.piDate, query.startDate));
    }
    if (query.endDate) {
      conditions.push(lte(salesProformaInvoices.piDate, query.endDate));
    }

    const creatorFirst = sql<string>`coalesce(${hrEmployees.firstName}, ${users.firstName})`;
    const creatorLast = sql<string>`coalesce(${hrEmployees.lastName}, ${users.lastName})`;
    const direction = query.direction === 'asc' ? asc : desc;
    const sortColumn = {
      pi_number: salesProformaInvoices.piNumber,
      pi_date: salesProformaInvoices.piDate,
      customer_details: salesProformaInvoices.customerDetails,
      total_amount: salesProformaInvoices.totalAmount,
      first_name: creatorFirst,
    }[query.sort ?? 'pi_date'];

    return db
      .select({
        id: salesProformaInvoices.id,
        piNumber: salesProformaInvoices.piNumber,
        piDate: salesProformaInvoices.piDate,
        customerDetails: salesProformaInvoices.customerDetails,
        totalAmount: salesProformaInvoices.totalAmount,
        currency: salesProformaInvoices.currency,
        creatorFirstName: creatorFirst,
        creatorLastName: creatorLast,
      })
      .from(salesProformaInvoices)
      .leftJoin(users, eq(users.id, salesProformaInvoices.createdBy))
      .leftJoin(
        hrEmployees,
        and(
          eq(hrEmployees.userId, users.id),
          eq(hrEmployees.tenantId, salesProformaInvoices.tenantId),
        ),
      )
      .where(and(...conditions))
      .orderBy(direction(sortColumn));
  }

  async findHeader(tenantId: string, id: string) {
    const [row] = await db
      .select({
        id: salesProformaInvoices.id,
        piNumber: salesProformaInvoices.piNumber,
        piDate: salesProformaInvoices.piDate,
        customerDetails: salesProformaInvoices.customerDetails,
        billTo: salesProformaInvoices.billTo,
        shipTo: salesProformaInvoices.shipTo,
        termsConditions: salesProformaInvoices.termsConditions,
        totalAmount: salesProformaInvoices.totalAmount,
        currency: salesProformaInvoices.currency,
        createdAt: salesProformaInvoices.createdAt,
        createdBy: salesProformaInvoices.createdBy,
        creatorFirstName: sql<
          string | null
        >`coalesce(${hrEmployees.firstName}, ${users.firstName})`,
        creatorLastName: sql<
          string | null
        >`coalesce(${hrEmployees.lastName}, ${users.lastName})`,
        creatorRole: users.role,
        signatureUrl: sql<
          string | null
        >`coalesce(${hrEmployees.signatureUrl}, ${users.signatureUrl})`,
      })
      .from(salesProformaInvoices)
      .leftJoin(users, eq(users.id, salesProformaInvoices.createdBy))
      .leftJoin(
        hrEmployees,
        and(
          eq(hrEmployees.userId, users.id),
          eq(hrEmployees.tenantId, salesProformaInvoices.tenantId),
        ),
      )
      .where(
        and(
          eq(salesProformaInvoices.tenantId, tenantId),
          eq(salesProformaInvoices.id, id),
        ),
      )
      .limit(1);
    return row;
  }

  async findItems(tenantId: string, proformaInvoiceId: string) {
    return db
      .select({
        id: salesProformaItems.id,
        itemName: salesProformaItems.itemName,
        partNumber: salesProformaItems.partNumber,
        description: salesProformaItems.description,
        quantity: salesProformaItems.quantity,
        unitPrice: salesProformaItems.unitPrice,
      })
      .from(salesProformaItems)
      .where(
        and(
          eq(salesProformaItems.tenantId, tenantId),
          eq(salesProformaItems.proformaInvoiceId, proformaInvoiceId),
        ),
      )
      .orderBy(asc(salesProformaItems.sortOrder), asc(salesProformaItems.id));
  }

  async findActor(
    tenantId: string,
    userId: string,
  ): Promise<ProformaActor | undefined> {
    const [row] = await db
      .select({
        firstName: sql<string>`coalesce(${hrEmployees.firstName}, ${users.firstName})`,
        lastName: sql<string>`coalesce(${hrEmployees.lastName}, ${users.lastName})`,
        role: users.role,
        signatureUrl: sql<
          string | null
        >`coalesce(${hrEmployees.signatureUrl}, ${users.signatureUrl})`,
        passwordHash: users.passwordHash,
      })
      .from(users)
      .leftJoin(
        hrEmployees,
        and(
          eq(hrEmployees.userId, users.id),
          eq(hrEmployees.tenantId, tenantId),
        ),
      )
      .where(and(eq(users.id, userId), eq(users.organizationId, tenantId)))
      .limit(1);
    return row;
  }

  async create(header: ProformaHeaderInput, items: NewSalesProformaItem[]) {
    return db.transaction(async (tx) => {
      const [created] = await tx
        .insert(salesProformaInvoices)
        .values(header)
        .returning({ id: salesProformaInvoices.id });
      if (!created) throw new Error('MISSING_PI');
      if (items.length) {
        await tx.insert(salesProformaItems).values(
          items.map((item) => ({
            ...item,
            proformaInvoiceId: created.id,
          })),
        );
      }
      return created;
    });
  }

  async update(
    tenantId: string,
    id: string,
    header: {
      piDate: string;
      customerDetails: string;
      billTo: string;
      shipTo: string;
      termsConditions: string | null;
      totalAmount: string;
      currency: string;
    },
    items: NewSalesProformaItem[],
  ) {
    return db.transaction(async (tx) => {
      const [updated] = await tx
        .update(salesProformaInvoices)
        .set({ ...header, updatedAt: new Date() })
        .where(
          and(
            eq(salesProformaInvoices.tenantId, tenantId),
            eq(salesProformaInvoices.id, id),
          ),
        )
        .returning({ id: salesProformaInvoices.id });
      if (!updated) return undefined;
      await tx
        .delete(salesProformaItems)
        .where(
          and(
            eq(salesProformaItems.tenantId, tenantId),
            eq(salesProformaItems.proformaInvoiceId, id),
          ),
        );
      if (items.length) {
        await tx.insert(salesProformaItems).values(items);
      }
      return updated;
    });
  }

  async purge(tenantId: string, id: string) {
    const [removed] = await db
      .delete(salesProformaInvoices)
      .where(
        and(
          eq(salesProformaInvoices.tenantId, tenantId),
          eq(salesProformaInvoices.id, id),
        ),
      )
      .returning({ id: salesProformaInvoices.id });
    return removed;
  }
}
