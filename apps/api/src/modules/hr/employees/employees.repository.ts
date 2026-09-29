import { Injectable } from '@nestjs/common';
import {
  and,
  asc,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  isNotNull,
  isNull,
  lte,
  ne,
  or,
  sql,
  type SQL,
} from 'drizzle-orm';

import {
  companyEmployeeRoles,
  db,
  hrEmployees,
  hrLeaveRequests,
  notifications,
  operationsDeliveryOrderItems,
  operationsDeliveryOrders,
  salesLeads,
  salesOpportunities,
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

  async findByWorkEmail(tenantId: string, email: string, exceptId?: string) {
    const conditions: SQL[] = [
      eq(hrEmployees.tenantId, tenantId),
      sql`lower(${hrEmployees.workEmail}) = ${email.toLowerCase()}`,
    ];

    if (exceptId) {
      conditions.push(ne(hrEmployees.id, exceptId));
    }

    const [row] = await db
      .select({ id: hrEmployees.id })
      .from(hrEmployees)
      .where(and(...conditions))
      .limit(1);

    return row ?? null;
  }

  searchActive(tenantId: string, query: string) {
    const pattern = `%${query.trim()}%`;

    return db
      .select({
        id: hrEmployees.id,
        first_name: hrEmployees.firstName,
        last_name: hrEmployees.lastName,
      })
      .from(hrEmployees)
      .where(
        and(
          eq(hrEmployees.tenantId, tenantId),
          eq(hrEmployees.status, 'ACTIVE'),
          or(
            ilike(hrEmployees.firstName, pattern),
            ilike(hrEmployees.lastName, pattern),
          ),
        ),
      )
      .limit(5);
  }

  async hardDelete(tenantId: string, employeeId: string, userId: string | null) {
    await db.transaction(async (tx) => {
      if (userId) {
        await tx
          .delete(notifications)
          .where(eq(notifications.recipientUserId, userId));
      }

      await tx
        .delete(hrLeaveRequests)
        .where(
          and(
            eq(hrLeaveRequests.tenantId, tenantId),
            eq(hrLeaveRequests.employeeId, employeeId),
          ),
        );

      await tx
        .delete(hrEmployees)
        .where(
          and(eq(hrEmployees.tenantId, tenantId), eq(hrEmployees.id, employeeId)),
        );
    });
  }

  async bulkDelete(tenantId: string, ids: string[]) {
    await db.transaction(async (tx) => {
      await tx
        .update(hrEmployees)
        .set({ managerId: null, updatedAt: new Date() })
        .where(
          and(
            eq(hrEmployees.tenantId, tenantId),
            inArray(hrEmployees.managerId, ids),
          ),
        );

      await tx
        .delete(hrEmployees)
        .where(
          and(eq(hrEmployees.tenantId, tenantId), inArray(hrEmployees.id, ids)),
        );
    });
  }

  async crmDeals(
    tenantId: string,
    ownerUserId: string,
    start: Date,
    end: Date,
  ) {
    return db
      .select({
        deal_value: salesOpportunities.amount,
        updated_at: salesOpportunities.updatedAt,
        remarks: salesOpportunities.description,
        company_name: salesLeads.companyName,
        contact_person: sql<string>`concat(${salesLeads.firstName}, ' ', ${salesLeads.lastName})`,
      })
      .from(salesOpportunities)
      .innerJoin(salesLeads, eq(salesLeads.id, salesOpportunities.leadId))
      .where(
        and(
          eq(salesOpportunities.tenantId, tenantId),
          eq(salesLeads.ownerUserId, ownerUserId),
          eq(salesOpportunities.status, 'WON'),
          gte(salesOpportunities.updatedAt, start),
          lte(salesOpportunities.updatedAt, end),
        ),
      )
      .orderBy(desc(salesOpportunities.updatedAt));
  }

  async employeeSales(tenantId: string, userId: string, start: string, end: string) {
    const rows = await db
      .select({
        id: operationsDeliveryOrders.id,
        invoice_date: operationsDeliveryOrders.deliveryDate,
        client_name: operationsDeliveryOrders.customerName,
        do_number: operationsDeliveryOrders.deliveryNumber,
        products: sql<string | null>`string_agg(concat(${operationsDeliveryOrderItems.itemName}, ' (', ${operationsDeliveryOrderItems.quantity}, ')'), '<br>')`,
        grand_total: sql<string>`coalesce(sum(${operationsDeliveryOrderItems.quantity} * ${operationsDeliveryOrderItems.unitPrice}), 0)`,
      })
      .from(operationsDeliveryOrders)
      .leftJoin(
        operationsDeliveryOrderItems,
        eq(
          operationsDeliveryOrderItems.deliveryOrderId,
          operationsDeliveryOrders.id,
        ),
      )
      .where(
        and(
          eq(operationsDeliveryOrders.tenantId, tenantId),
          eq(operationsDeliveryOrders.deliveredBy, userId),
          gte(operationsDeliveryOrders.deliveryDate, start),
          lte(operationsDeliveryOrders.deliveryDate, end),
        ),
      )
      .groupBy(
        operationsDeliveryOrders.id,
        operationsDeliveryOrders.deliveryDate,
        operationsDeliveryOrders.customerName,
        operationsDeliveryOrders.deliveryNumber,
      )
      .orderBy(desc(operationsDeliveryOrders.deliveryDate));

    return rows;
  }

  async reassignLead(tenantId: string, leadId: string, ownerUserId: string | null) {
    const [updated] = await db
      .update(salesLeads)
      .set({ ownerUserId, updatedAt: new Date() })
      .where(and(eq(salesLeads.tenantId, tenantId), eq(salesLeads.id, leadId)))
      .returning({ id: salesLeads.id });

    return updated ?? null;
  }

  async leadsForOwner(tenantId: string, ownerUserId: string) {
    return db
      .select({
        id: salesLeads.id,
        company_name: salesLeads.companyName,
        contact_person: sql<string>`concat(${salesLeads.firstName}, ' ', ${salesLeads.lastName})`,
        email: salesLeads.email,
        phone: salesLeads.phone,
        status: salesLeads.status,
        assigned_to: salesLeads.ownerUserId,
      })
      .from(salesLeads)
      .where(
        and(
          eq(salesLeads.tenantId, tenantId),
          eq(salesLeads.ownerUserId, ownerUserId),
        ),
      )
      .orderBy(desc(salesLeads.id));
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
