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
  hrAttendance,
  hrEmployees,
  hrFieldVisits,
  hrLeaveRequests,
  organizations,
  type HrAttendance,
  type NewHrAttendance,
} from '@erp/db';

import { getPaginationOffset } from '../../../common/pagination';

export interface AttendanceListRow {
  attendance: HrAttendance;
  employeeCode: string;
  firstName: string;
  lastName: string;
}

export interface ListAttendanceInput {
  tenantId: string;
  search?: string;
  startDate: string;
  endDate: string;
  page: number;
  limit: number;
}

export interface AttendanceOfficeSettings {
  officeStartTime: string;
  officeEndTime: string;
  timezone: string;
}

export interface ApprovedLeaveRow {
  employeeId: string;
  leaveType: 'ANNUAL' | 'SICK' | 'CASUAL';
  startDate: string;
  endDate: string;
}

export interface FieldVisitRow {
  employeeId: string;
  visitDate: string;
  agenda: string;
  outTime: string;
  inTime: string | null;
}

@Injectable()
export class AttendanceRepository {
  async list(input: ListAttendanceInput): Promise<{
    data: AttendanceListRow[];
    total: number;
  }> {
    const conditions = this.listConditions(input);
    const where = and(...conditions);

    const [rows, totals] = await Promise.all([
      db
        .select({
          attendance: hrAttendance,
          employeeCode: hrEmployees.employeeCode,
          firstName: hrEmployees.firstName,
          lastName: hrEmployees.lastName,
        })
        .from(hrAttendance)
        .innerJoin(hrEmployees, eq(hrEmployees.id, hrAttendance.employeeId))
        .where(where)
        .orderBy(desc(hrAttendance.punchDate), asc(hrEmployees.firstName))
        .limit(input.limit)
        .offset(getPaginationOffset(input)),
      db
        .select({ total: sql<number>`count(*)::int` })
        .from(hrAttendance)
        .innerJoin(hrEmployees, eq(hrEmployees.id, hrAttendance.employeeId))
        .where(where),
    ]);

    return {
      data: rows,
      total: totals[0]?.total ?? 0,
    };
  }

  async findById(
    tenantId: string,
    attendanceId: string,
  ): Promise<AttendanceListRow | null> {
    const [row] = await db
      .select({
        attendance: hrAttendance,
        employeeCode: hrEmployees.employeeCode,
        firstName: hrEmployees.firstName,
        lastName: hrEmployees.lastName,
      })
      .from(hrAttendance)
      .innerJoin(hrEmployees, eq(hrEmployees.id, hrAttendance.employeeId))
      .where(
        and(eq(hrAttendance.id, attendanceId), eq(hrAttendance.tenantId, tenantId)),
      )
      .limit(1);

    return row ?? null;
  }

  async findByEmployeeDate(
    tenantId: string,
    employeeId: string,
    punchDate: string,
  ): Promise<HrAttendance | null> {
    const [row] = await db
      .select()
      .from(hrAttendance)
      .where(
        and(
          eq(hrAttendance.tenantId, tenantId),
          eq(hrAttendance.employeeId, employeeId),
          eq(hrAttendance.punchDate, punchDate),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  listByEmployee(
    tenantId: string,
    employeeId: string,
    startDate: string,
    endDate: string,
  ) {
    return db
      .select({
        attendance: hrAttendance,
        employeeCode: hrEmployees.employeeCode,
        firstName: hrEmployees.firstName,
        lastName: hrEmployees.lastName,
      })
      .from(hrAttendance)
      .innerJoin(hrEmployees, eq(hrEmployees.id, hrAttendance.employeeId))
      .where(
        and(
          eq(hrAttendance.tenantId, tenantId),
          eq(hrAttendance.employeeId, employeeId),
          gte(hrAttendance.punchDate, startDate),
          lte(hrAttendance.punchDate, endDate),
        ),
      )
      .orderBy(desc(hrAttendance.punchDate));
  }

  listInRange(tenantId: string, startDate: string, endDate: string) {
    return db
      .select()
      .from(hrAttendance)
      .where(
        and(
          eq(hrAttendance.tenantId, tenantId),
          gte(hrAttendance.punchDate, startDate),
          lte(hrAttendance.punchDate, endDate),
        ),
      );
  }

  listApprovedLeaves(
    tenantId: string,
    startDate: string,
    endDate: string,
  ): Promise<ApprovedLeaveRow[]> {
    return db
      .select({
        employeeId: hrLeaveRequests.employeeId,
        leaveType: hrLeaveRequests.leaveType,
        startDate: hrLeaveRequests.startDate,
        endDate: hrLeaveRequests.endDate,
      })
      .from(hrLeaveRequests)
      .where(
        and(
          eq(hrLeaveRequests.tenantId, tenantId),
          eq(hrLeaveRequests.status, 'APPROVED'),
          lte(hrLeaveRequests.startDate, endDate),
          gte(hrLeaveRequests.endDate, startDate),
        ),
      );
  }

  listFieldVisits(
    tenantId: string,
    startDate: string,
    endDate: string,
  ): Promise<FieldVisitRow[]> {
    return db
      .select({
        employeeId: hrFieldVisits.employeeId,
        visitDate: hrFieldVisits.visitDate,
        agenda: hrFieldVisits.agenda,
        outTime: hrFieldVisits.outTime,
        inTime: hrFieldVisits.inTime,
      })
      .from(hrFieldVisits)
      .where(
        and(
          eq(hrFieldVisits.tenantId, tenantId),
          gte(hrFieldVisits.visitDate, startDate),
          lte(hrFieldVisits.visitDate, endDate),
        ),
      )
      .orderBy(asc(hrFieldVisits.outTime));
  }

  async getOfficeSettings(tenantId: string): Promise<AttendanceOfficeSettings> {
    const [row] = await db
      .select({
        officeStartTime: organizations.officeStartTime,
        officeEndTime: organizations.officeEndTime,
        timezone: organizations.timezone,
      })
      .from(organizations)
      .where(eq(organizations.id, tenantId))
      .limit(1);

    const timezone =
      !row?.timezone || row.timezone === 'UTC'
        ? 'Asia/Kathmandu'
        : row.timezone;

    return {
      officeStartTime: row?.officeStartTime || '09:00',
      officeEndTime: row?.officeEndTime || '17:00',
      timezone,
    };
  }

  async create(values: NewHrAttendance): Promise<HrAttendance> {
    const [row] = await db.insert(hrAttendance).values(values).returning();

    if (!row) {
      throw new Error('ATTENDANCE_CREATE_FAILED');
    }

    return row;
  }

  async update(
    tenantId: string,
    attendanceId: string,
    values: Partial<NewHrAttendance>,
  ): Promise<HrAttendance | null> {
    const [row] = await db
      .update(hrAttendance)
      .set({ ...values, updatedAt: new Date() })
      .where(
        and(eq(hrAttendance.id, attendanceId), eq(hrAttendance.tenantId, tenantId)),
      )
      .returning();

    return row ?? null;
  }

  async delete(tenantId: string, attendanceId: string): Promise<boolean> {
    const deleted = await db
      .delete(hrAttendance)
      .where(
        and(eq(hrAttendance.id, attendanceId), eq(hrAttendance.tenantId, tenantId)),
      )
      .returning({ id: hrAttendance.id });

    return deleted.length > 0;
  }

  private listConditions(input: ListAttendanceInput): SQL[] {
    const conditions: SQL[] = [
      eq(hrAttendance.tenantId, input.tenantId),
      eq(hrEmployees.tenantId, input.tenantId),
      gte(hrAttendance.punchDate, input.startDate),
      lte(hrAttendance.punchDate, input.endDate),
    ];

    if (input.search) {
      const pattern = `%${input.search}%`;
      const match = or(
        ilike(hrEmployees.employeeCode, pattern),
        ilike(hrEmployees.firstName, pattern),
        ilike(hrEmployees.lastName, pattern),
        ilike(
          sql<string>`concat(${hrEmployees.firstName}, ' ', ${hrEmployees.lastName})`,
          pattern,
        ),
      );

      if (match) {
        conditions.push(match);
      }
    }

    return conditions;
  }
}
