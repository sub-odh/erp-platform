import { Injectable } from '@nestjs/common';
import { and, asc, eq, inArray } from 'drizzle-orm';

import {
  db,
  hrEmployees,
  hrPartnerAssignments,
  hrPartners,
  type HrPartner,
  type NewHrPartner,
} from '@erp/db';

export interface PartnerAssignmentRow {
  partnerId: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  employeeCode: string;
}

@Injectable()
export class PartnersRepository {
  list(tenantId: string): Promise<HrPartner[]> {
    return db
      .select()
      .from(hrPartners)
      .where(eq(hrPartners.tenantId, tenantId))
      .orderBy(asc(hrPartners.name));
  }

  async findById(tenantId: string, partnerId: string): Promise<HrPartner | null> {
    const [row] = await db
      .select()
      .from(hrPartners)
      .where(and(eq(hrPartners.id, partnerId), eq(hrPartners.tenantId, tenantId)))
      .limit(1);

    return row ?? null;
  }

  async create(values: NewHrPartner): Promise<HrPartner> {
    const [row] = await db.insert(hrPartners).values(values).returning();

    if (!row) {
      throw new Error('PARTNER_CREATE_FAILED');
    }

    return row;
  }

  async update(
    tenantId: string,
    partnerId: string,
    values: Partial<NewHrPartner>,
  ): Promise<HrPartner | null> {
    const [row] = await db
      .update(hrPartners)
      .set({ ...values, updatedAt: new Date() })
      .where(and(eq(hrPartners.id, partnerId), eq(hrPartners.tenantId, tenantId)))
      .returning();

    return row ?? null;
  }

  async delete(tenantId: string, partnerId: string): Promise<boolean> {
    const deleted = await db
      .delete(hrPartners)
      .where(and(eq(hrPartners.id, partnerId), eq(hrPartners.tenantId, tenantId)))
      .returning({ id: hrPartners.id });

    return deleted.length > 0;
  }

  listAssignments(
    tenantId: string,
    partnerIds: string[],
  ): Promise<PartnerAssignmentRow[]> {
    if (partnerIds.length === 0) {
      return Promise.resolve([]);
    }

    return db
      .select({
        partnerId: hrPartnerAssignments.partnerId,
        employeeId: hrPartnerAssignments.employeeId,
        firstName: hrEmployees.firstName,
        lastName: hrEmployees.lastName,
        employeeCode: hrEmployees.employeeCode,
      })
      .from(hrPartnerAssignments)
      .innerJoin(hrEmployees, eq(hrPartnerAssignments.employeeId, hrEmployees.id))
      .where(
        and(
          eq(hrPartnerAssignments.tenantId, tenantId),
          inArray(hrPartnerAssignments.partnerId, partnerIds),
        ),
      )
      .orderBy(asc(hrEmployees.firstName), asc(hrEmployees.lastName));
  }

  replaceAssignments(
    tenantId: string,
    partnerId: string,
    employeeIds: string[],
  ) {
    return db.transaction(async (tx) => {
      await tx
        .delete(hrPartnerAssignments)
        .where(
          and(
            eq(hrPartnerAssignments.tenantId, tenantId),
            eq(hrPartnerAssignments.partnerId, partnerId),
          ),
        );

      const uniqueIds = [...new Set(employeeIds)];

      if (uniqueIds.length === 0) {
        return;
      }

      await tx.insert(hrPartnerAssignments).values(
        uniqueIds.map((employeeId) => ({
          tenantId,
          partnerId,
          employeeId,
        })),
      );
    });
  }
}
