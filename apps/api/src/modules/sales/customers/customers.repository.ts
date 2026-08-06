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

export interface UpdateCustomerRepositoryInput {
  customerCode?: string;
  name?: string;
  legalName?: string | null;
  taxNumber?: string | null;
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

  async create(input: CreateCustomerRepositoryInput): Promise<SalesCustomer> {
    const values: NewSalesCustomer = {
      tenantId: input.tenantId,
      customerCode: input.customerCode,
      name: input.name,
      legalName: input.legalName,
      taxNumber: input.taxNumber,
      email: input.email,
      phone: input.phone,
      website: input.website,

      billingAddressLine1: input.billingAddressLine1,
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

    return values;
  }
}
