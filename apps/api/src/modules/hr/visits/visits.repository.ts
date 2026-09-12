import { Injectable } from '@nestjs/common';
import { and, desc, eq, ilike, or } from 'drizzle-orm';

import {
  db,
  hrEmployees,
  hrFieldVisits,
  hrSupportVisits,
  type HrFieldVisit,
  type HrSupportVisit,
  type NewHrFieldVisit,
  type NewHrSupportVisit,
} from '@erp/db';

export interface SupportVisitRecord {
  visit: HrSupportVisit;
  technicianFirstName: string | null;
  technicianLastName: string | null;
}

export interface FieldVisitRecord {
  visit: HrFieldVisit;
  employeeFirstName: string;
  employeeLastName: string;
}

@Injectable()
export class VisitsRepository {
  async latestSupportNumber(tenantId: string, year: number) {
    const prefix = `SV-${year}-`;
    const [row] = await db
      .select({ visitNumber: hrSupportVisits.visitNumber })
      .from(hrSupportVisits)
      .where(
        and(
          eq(hrSupportVisits.tenantId, tenantId),
          ilike(hrSupportVisits.visitNumber, `${prefix}%`),
        ),
      )
      .orderBy(desc(hrSupportVisits.visitNumber))
      .limit(1);

    return row?.visitNumber ?? null;
  }

  async listSupport(tenantId: string): Promise<SupportVisitRecord[]> {
    const rows = await this.supportQuery()
      .where(eq(hrSupportVisits.tenantId, tenantId))
      .orderBy(desc(hrSupportVisits.visitDate), desc(hrSupportVisits.createdAt));

    return rows.map((row) => this.toSupportRecord(row));
  }

  async listMySupport(
    tenantId: string,
    employeeId: string,
    userId: string,
  ): Promise<SupportVisitRecord[]> {
    const rows = await this.supportQuery()
      .where(
        and(
          eq(hrSupportVisits.tenantId, tenantId),
          or(
            eq(hrSupportVisits.technicianId, employeeId),
            eq(hrSupportVisits.createdBy, userId),
          ),
        ),
      )
      .orderBy(desc(hrSupportVisits.visitDate), desc(hrSupportVisits.createdAt));

    return rows.map((row) => this.toSupportRecord(row));
  }

  async findSupport(
    tenantId: string,
    visitId: string,
  ): Promise<SupportVisitRecord | null> {
    const [row] = await this.supportQuery()
      .where(
        and(eq(hrSupportVisits.id, visitId), eq(hrSupportVisits.tenantId, tenantId)),
      )
      .limit(1);

    return row ? this.toSupportRecord(row) : null;
  }

  async createSupport(values: NewHrSupportVisit): Promise<HrSupportVisit> {
    const [row] = await db.insert(hrSupportVisits).values(values).returning();

    if (!row) {
      throw new Error('SUPPORT_VISIT_CREATE_FAILED');
    }

    return row;
  }

  async updateSupport(
    tenantId: string,
    visitId: string,
    values: Partial<NewHrSupportVisit>,
  ): Promise<HrSupportVisit | null> {
    const [row] = await db
      .update(hrSupportVisits)
      .set({ ...values, updatedAt: new Date() })
      .where(
        and(eq(hrSupportVisits.id, visitId), eq(hrSupportVisits.tenantId, tenantId)),
      )
      .returning();

    return row ?? null;
  }

  async listField(tenantId: string): Promise<FieldVisitRecord[]> {
    const rows = await this.fieldQuery()
      .where(eq(hrFieldVisits.tenantId, tenantId))
      .orderBy(desc(hrFieldVisits.visitDate), desc(hrFieldVisits.createdAt));

    return rows.map((row) => this.toFieldRecord(row));
  }

  async listMyField(
    tenantId: string,
    employeeId: string,
  ): Promise<FieldVisitRecord[]> {
    const rows = await this.fieldQuery()
      .where(
        and(
          eq(hrFieldVisits.tenantId, tenantId),
          eq(hrFieldVisits.employeeId, employeeId),
        ),
      )
      .orderBy(desc(hrFieldVisits.visitDate), desc(hrFieldVisits.createdAt));

    return rows.map((row) => this.toFieldRecord(row));
  }

  async findField(
    tenantId: string,
    visitId: string,
  ): Promise<FieldVisitRecord | null> {
    const [row] = await this.fieldQuery()
      .where(and(eq(hrFieldVisits.id, visitId), eq(hrFieldVisits.tenantId, tenantId)))
      .limit(1);

    return row ? this.toFieldRecord(row) : null;
  }

  async createField(values: NewHrFieldVisit): Promise<HrFieldVisit> {
    const [row] = await db.insert(hrFieldVisits).values(values).returning();

    if (!row) {
      throw new Error('FIELD_VISIT_CREATE_FAILED');
    }

    return row;
  }

  async updateField(
    tenantId: string,
    visitId: string,
    values: Partial<NewHrFieldVisit>,
  ): Promise<HrFieldVisit | null> {
    const [row] = await db
      .update(hrFieldVisits)
      .set({ ...values, updatedAt: new Date() })
      .where(and(eq(hrFieldVisits.id, visitId), eq(hrFieldVisits.tenantId, tenantId)))
      .returning();

    return row ?? null;
  }

  private supportQuery() {
    return db
      .select({
        visit: hrSupportVisits,
        technicianFirstName: hrEmployees.firstName,
        technicianLastName: hrEmployees.lastName,
      })
      .from(hrSupportVisits)
      .leftJoin(hrEmployees, eq(hrSupportVisits.technicianId, hrEmployees.id));
  }

  private fieldQuery() {
    return db
      .select({
        visit: hrFieldVisits,
        employeeFirstName: hrEmployees.firstName,
        employeeLastName: hrEmployees.lastName,
      })
      .from(hrFieldVisits)
      .innerJoin(hrEmployees, eq(hrFieldVisits.employeeId, hrEmployees.id));
  }

  private toSupportRecord(row: {
    visit: HrSupportVisit;
    technicianFirstName: string | null;
    technicianLastName: string | null;
  }): SupportVisitRecord {
    return row;
  }

  private toFieldRecord(row: {
    visit: HrFieldVisit;
    employeeFirstName: string;
    employeeLastName: string;
  }): FieldVisitRecord {
    return row;
  }
}
