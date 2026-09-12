import { Injectable } from '@nestjs/common';
import {
  and,
  asc,
  desc,
  eq,
  ilike,
  isNotNull,
  isNull,
  ne,
  or,
  sql,
  type SQL,
} from 'drizzle-orm';

import {
  companyEmployeeRoles,
  db,
  hrEmployees,
  users,
  type HrEmployee,
  type NewHrEmployee,
} from '@erp/db';

import { getPaginationOffset } from '../../../common/pagination';
import type {
  EmployeeSortField,
  EmployeeListStatus,
} from './dto/list-employees-query.dto';
import type {
  LinkedUserSummaryDto,
  ManagerSummaryDto,
} from './dto/employee-response.dto';

const userColumns = {
  id: users.id,
  email: users.email,
  firstName: users.firstName,
  lastName: users.lastName,
  role: users.role,
};

export interface EmployeeRecord {
  employee: HrEmployee;
  user: LinkedUserSummaryDto | null;
  manager: ManagerSummaryDto | null;
}

export interface ListEmployeesInput {
  tenantId: string;
  search?: string;
  status: EmployeeListStatus;
  department?: string;
  designation?: string;
  page: number;
  limit: number;
  sortBy: EmployeeSortField;
  sortDirection: 'asc' | 'desc';
}

@Injectable()
export class EmployeesRepository {
  async list(input: ListEmployeesInput): Promise<{
    data: EmployeeRecord[];
    total: number;
    counts: { active: number; inactive: number; total: number };
  }> {
    const conditions = this.listConditions(input);

    const sortColumn =
      input.sortBy === 'employeeCode'
        ? hrEmployees.employeeCode
        : input.sortBy === 'firstName'
          ? hrEmployees.firstName
          : input.sortBy === 'department'
            ? hrEmployees.department
            : input.sortBy === 'designation'
              ? hrEmployees.designation
              : input.sortBy === 'joinDate'
                ? hrEmployees.joinDate
                : hrEmployees.createdAt;

    const order =
      input.sortDirection === 'asc' ? asc(sortColumn) : desc(sortColumn);

    const managerAlias = db
      .select({
        id: hrEmployees.id,
        employeeCode: hrEmployees.employeeCode,
        firstName: hrEmployees.firstName,
        lastName: hrEmployees.lastName,
      })
      .from(hrEmployees)
      .as('manager');

    const [rows, totals, counts] = await Promise.all([
      db
        .select({
          employee: hrEmployees,
          user: userColumns,
          managerId: managerAlias.id,
          managerCode: managerAlias.employeeCode,
          managerFirstName: managerAlias.firstName,
          managerLastName: managerAlias.lastName,
        })
        .from(hrEmployees)
        .leftJoin(users, eq(users.id, hrEmployees.userId))
        .leftJoin(managerAlias, eq(managerAlias.id, hrEmployees.managerId))
        .where(and(...conditions))
        .orderBy(order)
        .limit(input.limit)
        .offset(getPaginationOffset(input)),
      db
        .select({ total: sql<number>`count(*)::int` })
        .from(hrEmployees)
        .where(and(...conditions)),
      this.counts(input.tenantId),
    ]);

    return {
      data: rows.map((row) => ({
        employee: row.employee,
        user: row.user?.id ? row.user : null,
        manager:
          row.managerId && row.managerCode && row.managerFirstName
            ? {
                id: row.managerId,
                employeeCode: row.managerCode,
                firstName: row.managerFirstName,
                lastName: row.managerLastName ?? '',
              }
            : null,
      })),
      total: totals[0]?.total ?? 0,
      counts,
    };
  }

  async findById(
    tenantId: string,
    employeeId: string,
  ): Promise<EmployeeRecord | null> {
    const managerAlias = db
      .select({
        id: hrEmployees.id,
        employeeCode: hrEmployees.employeeCode,
        firstName: hrEmployees.firstName,
        lastName: hrEmployees.lastName,
      })
      .from(hrEmployees)
      .as('manager');

    const [row] = await db
      .select({
        employee: hrEmployees,
        user: userColumns,
        managerId: managerAlias.id,
        managerCode: managerAlias.employeeCode,
        managerFirstName: managerAlias.firstName,
        managerLastName: managerAlias.lastName,
      })
      .from(hrEmployees)
      .leftJoin(users, eq(users.id, hrEmployees.userId))
      .leftJoin(managerAlias, eq(managerAlias.id, hrEmployees.managerId))
      .where(
        and(eq(hrEmployees.tenantId, tenantId), eq(hrEmployees.id, employeeId)),
      )
      .limit(1);

    if (!row) {
      return null;
    }

    return {
      employee: row.employee,
      user: row.user?.id ? row.user : null,
      manager:
        row.managerId && row.managerCode && row.managerFirstName
          ? {
              id: row.managerId,
              employeeCode: row.managerCode,
              firstName: row.managerFirstName,
              lastName: row.managerLastName ?? '',
            }
          : null,
    };
  }

  async findByCode(
    tenantId: string,
    employeeCode: string,
  ): Promise<HrEmployee | null> {
    const [row] = await db
      .select()
      .from(hrEmployees)
      .where(
        and(
          eq(hrEmployees.tenantId, tenantId),
          eq(hrEmployees.employeeCode, employeeCode),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  async findByUserId(
    tenantId: string,
    userId: string,
  ): Promise<HrEmployee | null> {
    const [row] = await db
      .select()
      .from(hrEmployees)
      .where(
        and(eq(hrEmployees.tenantId, tenantId), eq(hrEmployees.userId, userId)),
      )
      .limit(1);

    return row ?? null;
  }

  directory(tenantId: string) {
    return db
      .select({
        id: hrEmployees.id,
        employeeCode: hrEmployees.employeeCode,
        firstName: hrEmployees.firstName,
        lastName: hrEmployees.lastName,
        designation: hrEmployees.designation,
        department: hrEmployees.department,
        photoUrl: hrEmployees.photoUrl,
        managerId: hrEmployees.managerId,
        userId: hrEmployees.userId,
        status: hrEmployees.status,
      })
      .from(hrEmployees)
      .where(
        and(
          eq(hrEmployees.tenantId, tenantId),
          eq(hrEmployees.status, 'ACTIVE'),
        ),
      )
      .orderBy(asc(hrEmployees.firstName), asc(hrEmployees.lastName));
  }

  async findByDeviceId(
    tenantId: string,
    attendanceDeviceId: number,
  ): Promise<HrEmployee | null> {
    const [row] = await db
      .select()
      .from(hrEmployees)
      .where(
        and(
          eq(hrEmployees.tenantId, tenantId),
          eq(hrEmployees.attendanceDeviceId, attendanceDeviceId),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  async create(values: NewHrEmployee): Promise<HrEmployee> {
    const [created] = await db.insert(hrEmployees).values(values).returning();

    return created;
  }

  async update(
    tenantId: string,
    employeeId: string,
    values: Partial<NewHrEmployee>,
  ): Promise<HrEmployee | null> {
    const [updated] = await db
      .update(hrEmployees)
      .set({
        ...values,
        updatedAt: new Date(),
      })
      .where(
        and(eq(hrEmployees.tenantId, tenantId), eq(hrEmployees.id, employeeId)),
      )
      .returning();

    return updated ?? null;
  }

  async findActiveUser(
    tenantId: string,
    userId: string,
  ): Promise<LinkedUserSummaryDto | null> {
    const [row] = await db
      .select(userColumns)
      .from(users)
      .where(
        and(
          eq(users.organizationId, tenantId),
          eq(users.id, userId),
          isNull(users.deletedAt),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  async lookups(tenantId: string, excludeEmployeeId?: string) {
    const managerConditions: SQL[] = [
      eq(hrEmployees.tenantId, tenantId),
      eq(hrEmployees.status, 'ACTIVE'),
    ];

    if (excludeEmployeeId) {
      managerConditions.push(ne(hrEmployees.id, excludeEmployeeId));
    }

    const linkedUserConditions: SQL[] = [
      eq(hrEmployees.tenantId, tenantId),
      isNotNull(hrEmployees.userId),
    ];

    if (excludeEmployeeId) {
      linkedUserConditions.push(ne(hrEmployees.id, excludeEmployeeId));
    }

    const [
      departmentRows,
      roleRows,
      usedDesignationRows,
      managerRows,
      linkedUserRows,
    ] = await Promise.all([
      db
        .selectDistinct({ department: hrEmployees.department })
        .from(hrEmployees)
        .where(
          and(
            eq(hrEmployees.tenantId, tenantId),
            isNotNull(hrEmployees.department),
          ),
        )
        .orderBy(asc(hrEmployees.department)),
      db
        .select({ name: companyEmployeeRoles.name })
        .from(companyEmployeeRoles)
        .where(eq(companyEmployeeRoles.organizationId, tenantId))
        .orderBy(asc(companyEmployeeRoles.name)),
      db
        .selectDistinct({ designation: hrEmployees.designation })
        .from(hrEmployees)
        .where(
          and(
            eq(hrEmployees.tenantId, tenantId),
            isNotNull(hrEmployees.designation),
          ),
        )
        .orderBy(asc(hrEmployees.designation)),
      db
        .select({
          id: hrEmployees.id,
          employeeCode: hrEmployees.employeeCode,
          firstName: hrEmployees.firstName,
          lastName: hrEmployees.lastName,
        })
        .from(hrEmployees)
        .where(and(...managerConditions))
        .orderBy(asc(hrEmployees.firstName), asc(hrEmployees.lastName)),
      db
        .select({ userId: hrEmployees.userId })
        .from(hrEmployees)
        .where(and(...linkedUserConditions)),
    ]);

    const linkedUserIds = new Set(
      linkedUserRows
        .map((row) => row.userId)
        .filter((id): id is string => Boolean(id)),
    );

    const companyUsers = await db
      .select(userColumns)
      .from(users)
      .where(and(eq(users.organizationId, tenantId), isNull(users.deletedAt)))
      .orderBy(asc(users.firstName), asc(users.lastName));

    const designations = [
      ...new Set([
        ...roleRows.map((row) => row.name),
        ...usedDesignationRows
          .map((row) => row.designation)
          .filter((value): value is string => Boolean(value)),
      ]),
    ].sort((left, right) => left.localeCompare(right));

    return {
      departments: departmentRows
        .map((row) => row.department)
        .filter((value): value is string => Boolean(value)),
      designations,
      managers: managerRows,
      linkableUsers: companyUsers.filter((user) => !linkedUserIds.has(user.id)),
    };
  }

  async managerChainIds(
    tenantId: string,
    employeeId: string,
  ): Promise<string[]> {
    const ids: string[] = [];
    let currentId: string | null = employeeId;

    for (let depth = 0; depth < 20 && currentId; depth += 1) {
      const [row]: Array<{ managerId: string | null } | undefined> = await db
        .select({ managerId: hrEmployees.managerId })
        .from(hrEmployees)
        .where(
          and(
            eq(hrEmployees.tenantId, tenantId),
            eq(hrEmployees.id, currentId),
          ),
        )
        .limit(1);

      if (!row?.managerId) {
        break;
      }

      ids.push(row.managerId);
      currentId = row.managerId;
    }

    return ids;
  }

  async updateLeaveBalances(
    tenantId: string,
    employeeId: string,
    values: {
      annualLeaveBal?: string;
      sickLeaveBal?: string;
      casualLeaveBal?: string;
      annualLeaveEnabled?: boolean;
    },
  ): Promise<HrEmployee | null> {
    const [row] = await db
      .update(hrEmployees)
      .set({ ...values, updatedAt: new Date() })
      .where(
        and(eq(hrEmployees.id, employeeId), eq(hrEmployees.tenantId, tenantId)),
      )
      .returning();

    return row ?? null;
  }

  private listConditions(input: ListEmployeesInput): SQL[] {
    const conditions: SQL[] = [eq(hrEmployees.tenantId, input.tenantId)];

    if (input.status === 'active') {
      conditions.push(eq(hrEmployees.status, 'ACTIVE'));
    }

    if (input.status === 'inactive') {
      conditions.push(eq(hrEmployees.status, 'INACTIVE'));
    }

    if (input.department) {
      conditions.push(eq(hrEmployees.department, input.department));
    }

    if (input.designation) {
      conditions.push(eq(hrEmployees.designation, input.designation));
    }

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
        ilike(hrEmployees.workEmail, pattern),
        ilike(hrEmployees.phone, pattern),
        ilike(hrEmployees.department, pattern),
        ilike(hrEmployees.designation, pattern),
        ilike(hrEmployees.panNumber, pattern),
      );

      if (match) {
        conditions.push(match);
      }
    }

    return conditions;
  }

  private async counts(tenantId: string) {
    const [row] = await db
      .select({
        active: sql<number>`count(*) filter (where ${hrEmployees.status} = 'ACTIVE')::int`,
        inactive: sql<number>`count(*) filter (where ${hrEmployees.status} = 'INACTIVE')::int`,
        total: sql<number>`count(*)::int`,
      })
      .from(hrEmployees)
      .where(eq(hrEmployees.tenantId, tenantId));

    return {
      active: row?.active ?? 0,
      inactive: row?.inactive ?? 0,
      total: row?.total ?? 0,
    };
  }
}
