import { Injectable } from '@nestjs/common';
import { and, asc, eq, isNull } from 'drizzle-orm';

import {
  db,
  salesCustomerContacts,
  salesCustomers,
  type NewSalesCustomerContact,
  type SalesCustomerContact,
} from '@erp/db';

export interface CreateCustomerContactRepositoryInput {
  tenantId: string;
  customerId: string;
  actorUserId: string;

  firstName: string;
  lastName: string;

  jobTitle?: string;
  email?: string;
  phone?: string;
  mobile?: string;

  isPrimary?: boolean;
  isActive?: boolean;
}

export interface UpdateCustomerContactRepositoryInput {
  firstName?: string;
  lastName?: string;

  jobTitle?: string | null;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;

  isPrimary?: boolean;
  isActive?: boolean;
}

@Injectable()
export class CustomerContactsRepository {
  async customerExists(tenantId: string, customerId: string): Promise<boolean> {
    const [customer] = await db
      .select({
        id: salesCustomers.id,
      })
      .from(salesCustomers)
      .where(
        and(
          eq(salesCustomers.id, customerId),
          eq(salesCustomers.tenantId, tenantId),
          isNull(salesCustomers.deletedAt),
        ),
      )
      .limit(1);

    return Boolean(customer);
  }

  async list(
    tenantId: string,
    customerId: string,
  ): Promise<SalesCustomerContact[]> {
    return db
      .select()
      .from(salesCustomerContacts)
      .where(
        and(
          eq(salesCustomerContacts.tenantId, tenantId),
          eq(salesCustomerContacts.customerId, customerId),
          isNull(salesCustomerContacts.deletedAt),
        ),
      )
      .orderBy(
        asc(salesCustomerContacts.firstName),
        asc(salesCustomerContacts.lastName),
      );
  }

  async findById(
    tenantId: string,
    customerId: string,
    contactId: string,
  ): Promise<SalesCustomerContact | undefined> {
    const [contact] = await db
      .select()
      .from(salesCustomerContacts)
      .where(
        and(
          eq(salesCustomerContacts.id, contactId),
          eq(salesCustomerContacts.tenantId, tenantId),
          eq(salesCustomerContacts.customerId, customerId),
          isNull(salesCustomerContacts.deletedAt),
        ),
      )
      .limit(1);

    return contact;
  }

  async create(
    input: CreateCustomerContactRepositoryInput,
  ): Promise<SalesCustomerContact> {
    return db.transaction(async (tx) => {
      if (input.isPrimary) {
        await tx
          .update(salesCustomerContacts)
          .set({
            isPrimary: false,
            updatedBy: input.actorUserId,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(salesCustomerContacts.tenantId, input.tenantId),
              eq(salesCustomerContacts.customerId, input.customerId),
              eq(salesCustomerContacts.isPrimary, true),
              isNull(salesCustomerContacts.deletedAt),
            ),
          );
      }

      const values: NewSalesCustomerContact = {
        tenantId: input.tenantId,

        customerId: input.customerId,

        firstName: input.firstName,

        lastName: input.lastName,

        jobTitle: input.jobTitle,

        email: input.email,

        phone: input.phone,

        mobile: input.mobile,

        isPrimary: input.isPrimary ?? false,

        isActive: input.isActive ?? true,

        createdBy: input.actorUserId,

        updatedBy: input.actorUserId,
      };

      const [contact] = await tx
        .insert(salesCustomerContacts)
        .values(values)
        .returning();

      if (!contact) {
        throw new Error('Database did not return the created customer contact');
      }

      return contact;
    });
  }

  async update(
    tenantId: string,
    customerId: string,
    contactId: string,
    actorUserId: string,
    input: UpdateCustomerContactRepositoryInput,
  ): Promise<SalesCustomerContact | undefined> {
    return db.transaction(async (tx) => {
      if (input.isPrimary === true) {
        await tx
          .update(salesCustomerContacts)
          .set({
            isPrimary: false,
            updatedBy: actorUserId,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(salesCustomerContacts.tenantId, tenantId),
              eq(salesCustomerContacts.customerId, customerId),
              eq(salesCustomerContacts.isPrimary, true),
              isNull(salesCustomerContacts.deletedAt),
            ),
          );
      }

      const values = this.createUpdateValues(input, actorUserId);

      const [contact] = await tx
        .update(salesCustomerContacts)
        .set(values)
        .where(
          and(
            eq(salesCustomerContacts.id, contactId),
            eq(salesCustomerContacts.tenantId, tenantId),
            eq(salesCustomerContacts.customerId, customerId),
            isNull(salesCustomerContacts.deletedAt),
          ),
        )
        .returning();

      return contact;
    });
  }

  async updateStatus(
    tenantId: string,
    customerId: string,
    contactId: string,
    actorUserId: string,
    isActive: boolean,
  ): Promise<SalesCustomerContact | undefined> {
    const [contact] = await db
      .update(salesCustomerContacts)
      .set({
        isActive,
        updatedBy: actorUserId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(salesCustomerContacts.id, contactId),
          eq(salesCustomerContacts.tenantId, tenantId),
          eq(salesCustomerContacts.customerId, customerId),
          isNull(salesCustomerContacts.deletedAt),
        ),
      )
      .returning();

    return contact;
  }

  async archive(
    tenantId: string,
    customerId: string,
    contactId: string,
    actorUserId: string,
  ): Promise<boolean> {
    const [contact] = await db
      .update(salesCustomerContacts)
      .set({
        isActive: false,
        isPrimary: false,

        deletedAt: new Date(),

        updatedBy: actorUserId,

        updatedAt: new Date(),
      })
      .where(
        and(
          eq(salesCustomerContacts.id, contactId),
          eq(salesCustomerContacts.tenantId, tenantId),
          eq(salesCustomerContacts.customerId, customerId),
          isNull(salesCustomerContacts.deletedAt),
        ),
      )
      .returning({
        id: salesCustomerContacts.id,
      });

    return Boolean(contact);
  }

  private createUpdateValues(
    input: UpdateCustomerContactRepositoryInput,
    actorUserId: string,
  ): Partial<NewSalesCustomerContact> {
    const values: Partial<NewSalesCustomerContact> = {
      updatedBy: actorUserId,

      updatedAt: new Date(),
    };

    if (input.firstName !== undefined) {
      values.firstName = input.firstName;
    }

    if (input.lastName !== undefined) {
      values.lastName = input.lastName;
    }

    if (input.jobTitle !== undefined) {
      values.jobTitle = input.jobTitle;
    }

    if (input.email !== undefined) {
      values.email = input.email;
    }

    if (input.phone !== undefined) {
      values.phone = input.phone;
    }

    if (input.mobile !== undefined) {
      values.mobile = input.mobile;
    }

    if (input.isPrimary !== undefined) {
      values.isPrimary = input.isPrimary;
    }

    if (input.isActive !== undefined) {
      values.isActive = input.isActive;
    }

    return values;
  }
}
