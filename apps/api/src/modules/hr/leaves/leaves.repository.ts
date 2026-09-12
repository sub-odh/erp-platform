import { Injectable } from '@nestjs/common';
import { and, asc, desc, eq, gte, lte, ne, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import {
  db,
  hrEmployees,
  hrLeaveRequests,
  type HrLeaveRequest,
  type NewHrLeaveRequest,
} from '@erp/db';

const substitutes = alias(hrEmployees, 'leave_substitutes');

export interface LeaveEmployeeSummary {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  designation: string | null;
  department: string | null;
  photoUrl: string | null;
  annualLeaveBal: string;
  sickLeaveBal: string;
  casualLeaveBal: string;
  annualLeaveEnabled: boolean;
}

export interface LeaveSubstituteSummary {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
}

export interface LeaveRequestRecord {
  request: HrLeaveRequest;
  employee: LeaveEmployeeSummary;
  substitute: LeaveSubstituteSummary | null;
}

export interface LeaveTopTakerRow {
  employeeId: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  totalDays: string;
}

const employeeColumns = {
  id: hrEmployees.id,
  employeeCode: hrEmployees.employeeCode,
  firstName: hrEmployees.firstName,
  lastName: hrEmployees.lastName,
  designation: hrEmployees.designation,
  department: hrEmployees.department,
  photoUrl: hrEmployees.photoUrl,
  annualLeaveBal: hrEmployees.annualLeaveBal,
  sickLeaveBal: hrEmployees.sickLeaveBal,
  casualLeaveBal: hrEmployees.casualLeaveBal,
  annualLeaveEnabled: hrEmployees.annualLeaveEnabled,
};

const substituteColumns = {
  id: substitutes.id,
  employeeCode: substitutes.employeeCode,
  firstName: substitutes.firstName,
  lastName: substitutes.lastName,
};

@Injectable()
export class LeavesRepository {
  async findById(
    tenantId: string,
    requestId: string,
  ): Promise<HrLeaveRequest | null> {
    const [row] = await db
      .select()
      .from(hrLeaveRequests)
      .where(
        and(
          eq(hrLeaveRequests.id, requestId),
          eq(hrLeaveRequests.tenantId, tenantId),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  async findRecord(
    tenantId: string,
    requestId: string,
  ): Promise<LeaveRequestRecord | null> {
    const [row] = await this.requestQuery()
      .where(
        and(
          eq(hrLeaveRequests.id, requestId),
          eq(hrLeaveRequests.tenantId, tenantId),
        ),
      )
      .limit(1);

    return row ? this.toRecord(row) : null;
  }

  async listPending(tenantId: string): Promise<LeaveRequestRecord[]> {
    const rows = await this.requestQuery()
      .where(
        and(
          eq(hrLeaveRequests.tenantId, tenantId),
          eq(hrLeaveRequests.status, 'PENDING'),
        ),
      )
      .orderBy(asc(hrLeaveRequests.startDate), asc(hrLeaveRequests.createdAt));

    return rows.map((row) => this.toRecord(row));
  }

  async listHistory(
    tenantId: string,
    limit = 100,
  ): Promise<LeaveRequestRecord[]> {
    const rows = await this.requestQuery()
      .where(
        and(
          eq(hrLeaveRequests.tenantId, tenantId),
          ne(hrLeaveRequests.status, 'PENDING'),
        ),
      )
      .orderBy(desc(hrLeaveRequests.updatedAt), desc(hrLeaveRequests.createdAt))
      .limit(limit);

    return rows.map((row) => this.toRecord(row));
  }

  async listApprovedOnDate(
    tenantId: string,
    onDate: string,
  ): Promise<LeaveRequestRecord[]> {
    const rows = await this.requestQuery()
      .where(
        and(
          eq(hrLeaveRequests.tenantId, tenantId),
          eq(hrLeaveRequests.status, 'APPROVED'),
          lte(hrLeaveRequests.startDate, onDate),
          gte(hrLeaveRequests.endDate, onDate),
        ),
      )
      .orderBy(asc(hrLeaveRequests.startDate), asc(hrEmployees.firstName));

    return rows.map((row) => this.toRecord(row));
  }

  async listByEmployee(
    tenantId: string,
    employeeId: string,
  ): Promise<LeaveRequestRecord[]> {
    const rows = await this.requestQuery()
      .where(
        and(
          eq(hrLeaveRequests.tenantId, tenantId),
          eq(hrLeaveRequests.employeeId, employeeId),
        ),
      )
      .orderBy(desc(hrLeaveRequests.createdAt));

    return rows.map((row) => this.toRecord(row));
  }

  async listTopTakers(
    tenantId: string,
    limit = 10,
  ): Promise<LeaveTopTakerRow[]> {
    return db
      .select({
        employeeId: hrLeaveRequests.employeeId,
        employeeCode: hrEmployees.employeeCode,
        firstName: hrEmployees.firstName,
        lastName: hrEmployees.lastName,
        photoUrl: hrEmployees.photoUrl,
        totalDays: sql<string>`coalesce(sum(${hrLeaveRequests.days}), 0)::text`,
      })
      .from(hrLeaveRequests)
      .innerJoin(hrEmployees, eq(hrEmployees.id, hrLeaveRequests.employeeId))
      .where(
        and(
          eq(hrLeaveRequests.tenantId, tenantId),
          eq(hrLeaveRequests.status, 'APPROVED'),
        ),
      )
      .groupBy(
        hrLeaveRequests.employeeId,
        hrEmployees.employeeCode,
        hrEmployees.firstName,
        hrEmployees.lastName,
        hrEmployees.photoUrl,
      )
      .orderBy(desc(sql`sum(${hrLeaveRequests.days})`))
      .limit(limit);
  }

  listActiveBalances(tenantId: string): Promise<LeaveEmployeeSummary[]> {
    return db
      .select(employeeColumns)
      .from(hrEmployees)
      .where(
        and(
          eq(hrEmployees.tenantId, tenantId),
          eq(hrEmployees.status, 'ACTIVE'),
        ),
      )
      .orderBy(asc(hrEmployees.firstName), asc(hrEmployees.lastName));
  }

  async create(values: NewHrLeaveRequest): Promise<HrLeaveRequest> {
    const [row] = await db.insert(hrLeaveRequests).values(values).returning();

    if (!row) {
      throw new Error('LEAVE_CREATE_FAILED');
    }

    return row;
  }

  async update(
    tenantId: string,
    requestId: string,
    values: Partial<NewHrLeaveRequest>,
  ): Promise<HrLeaveRequest | null> {
    const [row] = await db
      .update(hrLeaveRequests)
      .set({ ...values, updatedAt: new Date() })
      .where(
        and(
          eq(hrLeaveRequests.id, requestId),
          eq(hrLeaveRequests.tenantId, tenantId),
        ),
      )
      .returning();

    return row ?? null;
  }

  async delete(tenantId: string, requestId: string): Promise<boolean> {
    const deleted = await db
      .delete(hrLeaveRequests)
      .where(
        and(
          eq(hrLeaveRequests.id, requestId),
          eq(hrLeaveRequests.tenantId, tenantId),
        ),
      )
      .returning({ id: hrLeaveRequests.id });

    return deleted.length > 0;
  }

  private requestQuery() {
    return db
      .select({
        request: hrLeaveRequests,
        employee: employeeColumns,
        substitute: substituteColumns,
      })
      .from(hrLeaveRequests)
      .innerJoin(hrEmployees, eq(hrEmployees.id, hrLeaveRequests.employeeId))
      .leftJoin(substitutes, eq(substitutes.id, hrLeaveRequests.substituteId));
  }

  private toRecord(row: {
    request: HrLeaveRequest;
    employee: LeaveEmployeeSummary;
    substitute: LeaveSubstituteSummary | null;
  }): LeaveRequestRecord {
    return {
      request: row.request,
      employee: row.employee,
      substitute: row.substitute?.id ? row.substitute : null,
    };
  }
}
