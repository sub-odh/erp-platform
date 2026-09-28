import { Injectable } from '@nestjs/common';
import {
  and,
  asc,
  desc,
  eq,
  ilike,
  isNull,
  or,
  sql,
  type SQL,
} from 'drizzle-orm';

import {
  db,
  financeInvoices,
  operationsDeliveryOrderItems,
  operationsDeliveryOrders,
  salesCustomers,
  type NewSalesCustomer,
  type SalesCustomer,
} from '@erp/db';

import type {
  CustomerSortField,
  SortDirection,
} from './dto/list-customers-query.dto';

import { getPaginationOffset } from '../../../common/pagination';

export interface ListCustomersRepositoryInput {
  tenantId: string;
  search?: string;
  isActive?: boolean;
  page: number;
  limit: number;
  sortBy: CustomerSortField;
  sortDirection: SortDirection;
}

export interface ListCustomersRepositoryResult {
  data: SalesCustomer[];
  total: number;
}

export interface CreateCustomerRepositoryInput {
  tenantId: string;
  actorUserId: string;
  customerCode: string;
  name: string;
  legalName?: string;
  taxNumber?: string;
  contactPerson?: string;
  address?: string;
  email?: string;
  phone?: string;
  website?: string;

  billingAddressLine1?: string;
  billingAddressLine2?: string;
  billingCity?: string;
  billingState?: string;
  billingPostalCode?: string;
  billingCountry?: string;

  shippingAddressLine1?: string;
  shippingAddressLine2?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingPostalCode?: string;
  shippingCountry?: string;

  creditLimit?: number;
  paymentTermsDays?: number;
  notes?: string;
  isActive?: boolean;
}

export interface CustomerDirectoryStats {
  activeDue: string;
  deliveryOrderCount: number;
}

export interface CustomerHistoryOrderRow {
  id: string;
  deliveryNumber: string;
  deliveryDate: string;
  totalAmount: string;
  balanceDue: string;
  status: string;
  invoiceId: string | null;
  invoiceNumber: string | null;
}

export interface UpdateCustomerRepositoryInput {
  customerCode?: string;
  name?: string;
  legalName?: string | null;
  taxNumber?: string | null;
  contactPerson?: string | null;
  address?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;

  billingAddressLine1?: string | null;
  billingAddressLine2?: string | null;
  billingCity?: string | null;
  billingState?: string | null;
  billingPostalCode?: string | null;
  billingCountry?: string | null;

  shippingAddressLine1?: string | null;
  shippingAddressLine2?: string | null;
  shippingCity?: string | null;
  shippingState?: string | null;
  shippingPostalCode?: string | null;
  shippingCountry?: string | null;

  creditLimit?: number;
  paymentTermsDays?: number;
  notes?: string | null;
  isActive?: boolean;
  logoUrl?: string | null;
  logoFileName?: string | null;
  logoMimeType?: string | null;
  logoSize?: number | null;
}

@Injectable()
export class CustomersRepository {
  async list(
    input: ListCustomersRepositoryInput,
  ): Promise<ListCustomersRepositoryResult> {
    const conditions = this.createListConditions(input);

    const offset = getPaginationOffset({
      page: input.page,
      limit: input.limit,
    });

    const orderColumn = this.getSortColumn(input.sortBy);

    const orderExpression =
      input.sortDirection === 'asc' ? asc(orderColumn) : desc(orderColumn);

    const [data, countResult] = await Promise.all([
      db
        .select()
        .from(salesCustomers)
        .where(and(...conditions))
        .orderBy(orderExpression)
        .limit(input.limit)
        .offset(offset),

      db
        .select({
          total: sql<number>`count(*)::int`,
        })
        .from(salesCustomers)
        .where(and(...conditions)),
    ]);

    return {
      data,
      total: countResult[0]?.total ?? 0,
    };
  }

  async findById(
    tenantId: string,
    customerId: string,
  ): Promise<SalesCustomer | undefined> {
    const [customer] = await db
      .select()
      .from(salesCustomers)
      .where(
        and(
          eq(salesCustomers.id, customerId),
          eq(salesCustomers.tenantId, tenantId),
          isNull(salesCustomers.deletedAt),
        ),
      )
      .limit(1);

    return customer;
  }

  async findByCode(
    tenantId: string,
    customerCode: string,
  ): Promise<SalesCustomer | undefined> {
    const [customer] = await db
      .select()
      .from(salesCustomers)
      .where(
        and(
          eq(salesCustomers.tenantId, tenantId),
          eq(salesCustomers.customerCode, customerCode),
          isNull(salesCustomers.deletedAt),
        ),
      )
      .limit(1);

    return customer;
  }

  async findByName(
    tenantId: string,
    name: string,
    excludingId?: string,
  ): Promise<SalesCustomer | undefined> {
    const conditions: SQL[] = [
      eq(salesCustomers.tenantId, tenantId),
      isNull(salesCustomers.deletedAt),
      sql`lower(${salesCustomers.name}) = ${name.trim().toLowerCase()}`,
    ];

    if (excludingId) {
      conditions.push(sql`${salesCustomers.id} <> ${excludingId}`);
    }

    const [customer] = await db
      .select()
      .from(salesCustomers)
      .where(and(...conditions))
      .limit(1);

    return customer;
  }

  async findByTaxNumber(
    tenantId: string,
    taxNumber: string,
    excludingId?: string,
  ): Promise<SalesCustomer | undefined> {
    const conditions: SQL[] = [
      eq(salesCustomers.tenantId, tenantId),
      isNull(salesCustomers.deletedAt),
      sql`lower(${salesCustomers.taxNumber}) = ${taxNumber.trim().toLowerCase()}`,
    ];

    if (excludingId) {
      conditions.push(sql`${salesCustomers.id} <> ${excludingId}`);
    }

    const [customer] = await db
      .select()
      .from(salesCustomers)
      .where(and(...conditions))
      .limit(1);

    return customer;
  }

  async nextCustomerCode(tenantId: string): Promise<string> {
    const [row] = await db
      .select({
        maxSeq: sql<number>`coalesce(max(nullif(regexp_replace(${salesCustomers.customerCode}, '\\D', '', 'g'), '')::int), 0)::int`,
      })
      .from(salesCustomers)
      .where(
        and(
          eq(salesCustomers.tenantId, tenantId),
          sql`${salesCustomers.customerCode} ~ '^CLI-[0-9]+$'`,
        ),
      );

    return `CLI-${String((row?.maxSeq ?? 0) + 1).padStart(4, '0')}`;
  }

  async loadDirectoryStats(
    tenantId: string,
  ): Promise<Map<string, CustomerDirectoryStats>> {
    const [dues, counts] = await Promise.all([
      db
        .select({
          nameKey: sql<string>`lower(${financeInvoices.customerName})`,
          outstanding: sql<string>`coalesce(sum(case when ${financeInvoices.status}::text in ('UNPAID', 'PARTIAL') then (${financeInvoices.totalAmount}::numeric - ${financeInvoices.paidAmount}::numeric) else 0 end), 0)::numeric`,
        })
        .from(financeInvoices)
        .where(eq(financeInvoices.tenantId, tenantId))
        .groupBy(sql`lower(${financeInvoices.customerName})`),
      db
        .select({
          nameKey: sql<string>`lower(${operationsDeliveryOrders.customerName})`,
          total: sql<number>`count(*)::int`,
        })
        .from(operationsDeliveryOrders)
        .where(eq(operationsDeliveryOrders.tenantId, tenantId))
        .groupBy(sql`lower(${operationsDeliveryOrders.customerName})`),
    ]);

    const stats = new Map<string, CustomerDirectoryStats>();

    for (const row of dues) {
      stats.set(row.nameKey, {
        activeDue: row.outstanding,
        deliveryOrderCount: 0,
      });
    }

    for (const row of counts) {
      const current = stats.get(row.nameKey) ?? {
        activeDue: '0.00',
        deliveryOrderCount: 0,
      };
      current.deliveryOrderCount = row.total;
      stats.set(row.nameKey, current);
    }

    return stats;
  }

  statsFor(
    customer: SalesCustomer,
    stats: Map<string, CustomerDirectoryStats>,
  ): CustomerDirectoryStats {
    return (
      stats.get(customer.name.trim().toLowerCase()) ?? {
        activeDue: '0.00',
        deliveryOrderCount: 0,
      }
    );
  }

  async listHistory(
    tenantId: string,
    customerName: string,
  ): Promise<CustomerHistoryOrderRow[]> {
    const nameKey = customerName.trim().toLowerCase();

    const rows = await db
      .select({
        id: operationsDeliveryOrders.id,
        deliveryNumber: operationsDeliveryOrders.deliveryNumber,
        deliveryDate: operationsDeliveryOrders.deliveryDate,
        totalAmount: sql<string>`coalesce(sum(${operationsDeliveryOrderItems.quantity} * ${operationsDeliveryOrderItems.unitPrice}), 0)::numeric`,
        paidAmount: sql<string>`coalesce(${financeInvoices.paidAmount}, 0)::numeric`,
        invoiceTotal: sql<string>`coalesce(${financeInvoices.totalAmount}, 0)::numeric`,
        invoiceStatus: financeInvoices.status,
        invoiceId: financeInvoices.id,
        invoiceNumber: financeInvoices.invoiceNumber,
      })
      .from(operationsDeliveryOrders)
      .leftJoin(
        operationsDeliveryOrderItems,
        eq(
          operationsDeliveryOrderItems.deliveryOrderId,
          operationsDeliveryOrders.id,
        ),
      )
      .leftJoin(
        financeInvoices,
        eq(financeInvoices.deliveryOrderId, operationsDeliveryOrders.id),
      )
      .where(
        and(
          eq(operationsDeliveryOrders.tenantId, tenantId),
          sql`lower(${operationsDeliveryOrders.customerName}) = ${nameKey}`,
        ),
      )
      .groupBy(
        operationsDeliveryOrders.id,
        financeInvoices.id,
        financeInvoices.status,
        financeInvoices.paidAmount,
        financeInvoices.totalAmount,
        financeInvoices.invoiceNumber,
      )
      .orderBy(
        desc(operationsDeliveryOrders.deliveryDate),
        desc(operationsDeliveryOrders.createdAt),
      );

    return rows.map((row) => {
      const invoiceTotal = Number(row.invoiceTotal);
      const orderTotal = Number(row.totalAmount);
      const totalAmount = invoiceTotal > 0 ? invoiceTotal : orderTotal;
      const paidAmount = Number(row.paidAmount);
      const balanceDue = Math.max(totalAmount - paidAmount, 0);
      let status = 'Pending';

      if (row.invoiceStatus === 'PAID' || (row.invoiceId && balanceDue <= 0)) {
        status = 'Paid';
      } else if (row.invoiceStatus === 'PARTIAL') {
        status = 'Partial';
      } else if (row.invoiceStatus === 'UNPAID') {
        status = 'Unpaid';
      } else if (row.invoiceStatus === 'VOID') {
        status = 'Voided';
      }

      return {
        id: row.id,
        deliveryNumber: row.deliveryNumber,
        deliveryDate: row.deliveryDate,
        totalAmount: totalAmount.toFixed(2),
        balanceDue: balanceDue.toFixed(2),
        status,
        invoiceId: row.invoiceId,
        invoiceNumber: row.invoiceNumber,
      };
    });
  }

  async softDelete(
    tenantId: string,
    customerId: string,
    actorUserId: string,
  ): Promise<SalesCustomer | undefined> {
    const [deleted] = await db
      .update(salesCustomers)
      .set({
        deletedAt: new Date(),
        updatedBy: actorUserId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(salesCustomers.id, customerId),
          eq(salesCustomers.tenantId, tenantId),
          isNull(salesCustomers.deletedAt),
        ),
      )
      .returning();

    return deleted;
  }

  async create(input: CreateCustomerRepositoryInput): Promise<SalesCustomer> {
    const values: NewSalesCustomer = {
      tenantId: input.tenantId,
      customerCode: input.customerCode,
      name: input.name,
      legalName: input.legalName,
      taxNumber: input.taxNumber,
      contactPerson: input.contactPerson,
      address: input.address,
      email: input.email,
      phone: input.phone,
      website: input.website,

      billingAddressLine1: input.billingAddressLine1 ?? input.address,
      billingAddressLine2: input.billingAddressLine2,
      billingCity: input.billingCity,
      billingState: input.billingState,
      billingPostalCode: input.billingPostalCode,
      billingCountry: input.billingCountry,

      shippingAddressLine1: input.shippingAddressLine1,
      shippingAddressLine2: input.shippingAddressLine2,
      shippingCity: input.shippingCity,
      shippingState: input.shippingState,
      shippingPostalCode: input.shippingPostalCode,
      shippingCountry: input.shippingCountry,

      creditLimit:
        input.creditLimit !== undefined ? input.creditLimit.toFixed(2) : '0.00',

      paymentTermsDays:
        input.paymentTermsDays !== undefined
          ? String(input.paymentTermsDays)
          : '0',

      notes: input.notes,
      isActive: input.isActive ?? true,
      createdBy: input.actorUserId,
      updatedBy: input.actorUserId,
    };

    const [createdCustomer] = await db
      .insert(salesCustomers)
      .values(values)
      .returning();

    if (!createdCustomer) {
      throw new Error('Database did not return the created customer');
    }

    return createdCustomer;
  }

  async update(
    tenantId: string,
    customerId: string,
    actorUserId: string,
    input: UpdateCustomerRepositoryInput,
  ): Promise<SalesCustomer | undefined> {
    const values = this.createUpdateValues(input, actorUserId);

    const [updatedCustomer] = await db
      .update(salesCustomers)
      .set(values)
      .where(
        and(
          eq(salesCustomers.id, customerId),
          eq(salesCustomers.tenantId, tenantId),
          isNull(salesCustomers.deletedAt),
        ),
      )
      .returning();

    return updatedCustomer;
  }

  async updateStatus(
    tenantId: string,
    customerId: string,
    actorUserId: string,
    isActive: boolean,
  ): Promise<SalesCustomer | undefined> {
    const [updatedCustomer] = await db
      .update(salesCustomers)
      .set({
        isActive,
        updatedBy: actorUserId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(salesCustomers.id, customerId),
          eq(salesCustomers.tenantId, tenantId),
          isNull(salesCustomers.deletedAt),
        ),
      )
      .returning();

    return updatedCustomer;
  }

  private createListConditions(input: ListCustomersRepositoryInput): SQL[] {
    const conditions: SQL[] = [
      eq(salesCustomers.tenantId, input.tenantId),
      isNull(salesCustomers.deletedAt),
    ];

    if (input.isActive !== undefined) {
      conditions.push(eq(salesCustomers.isActive, input.isActive));
    }

    const search = input.search?.trim();

    if (search) {
      const pattern = `%${search}%`;

      const searchCondition = or(
        ilike(salesCustomers.customerCode, pattern),
        ilike(salesCustomers.name, pattern),
        ilike(salesCustomers.legalName, pattern),
        ilike(salesCustomers.email, pattern),
        ilike(salesCustomers.phone, pattern),
        ilike(salesCustomers.taxNumber, pattern),
        ilike(salesCustomers.contactPerson, pattern),
      );

      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }

    return conditions;
  }

  private getSortColumn(sortBy: CustomerSortField) {
    switch (sortBy) {
      case 'customerCode':
        return salesCustomers.customerCode;

      case 'name':
        return salesCustomers.name;

      case 'updatedAt':
        return salesCustomers.updatedAt;

      case 'createdAt':
      default:
        return salesCustomers.createdAt;
    }
  }

  private createUpdateValues(
    input: UpdateCustomerRepositoryInput,
    actorUserId: string,
  ): Partial<NewSalesCustomer> {
    const values: Partial<NewSalesCustomer> = {
      updatedBy: actorUserId,
      updatedAt: new Date(),
    };

    if (input.customerCode !== undefined) {
      values.customerCode = input.customerCode;
    }

    if (input.name !== undefined) {
      values.name = input.name;
    }

    if (input.legalName !== undefined) {
      values.legalName = input.legalName;
    }

    if (input.taxNumber !== undefined) {
      values.taxNumber = input.taxNumber;
    }

    if (input.contactPerson !== undefined) {
      values.contactPerson = input.contactPerson;
    }

    if (input.address !== undefined) {
      values.address = input.address;
      if (input.billingAddressLine1 === undefined) {
        values.billingAddressLine1 = input.address;
      }
    }

    if (input.email !== undefined) {
      values.email = input.email;
    }

    if (input.phone !== undefined) {
      values.phone = input.phone;
    }

    if (input.website !== undefined) {
      values.website = input.website;
    }

    if (input.billingAddressLine1 !== undefined) {
      values.billingAddressLine1 = input.billingAddressLine1;
    }

    if (input.billingAddressLine2 !== undefined) {
      values.billingAddressLine2 = input.billingAddressLine2;
    }

    if (input.billingCity !== undefined) {
      values.billingCity = input.billingCity;
    }

    if (input.billingState !== undefined) {
      values.billingState = input.billingState;
    }

    if (input.billingPostalCode !== undefined) {
      values.billingPostalCode = input.billingPostalCode;
    }

    if (input.billingCountry !== undefined) {
      values.billingCountry = input.billingCountry;
    }

    if (input.shippingAddressLine1 !== undefined) {
      values.shippingAddressLine1 = input.shippingAddressLine1;
    }

    if (input.shippingAddressLine2 !== undefined) {
      values.shippingAddressLine2 = input.shippingAddressLine2;
    }

    if (input.shippingCity !== undefined) {
      values.shippingCity = input.shippingCity;
    }

    if (input.shippingState !== undefined) {
      values.shippingState = input.shippingState;
    }

    if (input.shippingPostalCode !== undefined) {
      values.shippingPostalCode = input.shippingPostalCode;
    }

    if (input.shippingCountry !== undefined) {
      values.shippingCountry = input.shippingCountry;
    }

    if (input.creditLimit !== undefined) {
      values.creditLimit = input.creditLimit.toFixed(2);
    }

    if (input.paymentTermsDays !== undefined) {
      values.paymentTermsDays = String(input.paymentTermsDays);
    }

    if (input.notes !== undefined) {
      values.notes = input.notes;
    }

    if (input.isActive !== undefined) {
      values.isActive = input.isActive;
    }

    if (input.logoUrl !== undefined) {
      values.logoUrl = input.logoUrl;
    }

    if (input.logoFileName !== undefined) {
      values.logoFileName = input.logoFileName;
    }

    if (input.logoMimeType !== undefined) {
      values.logoMimeType = input.logoMimeType;
    }

    if (input.logoSize !== undefined) {
      values.logoSize = input.logoSize;
    }

    return values;
  }
}
