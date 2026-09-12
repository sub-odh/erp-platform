import { Injectable } from '@nestjs/common';
import { and, desc, eq, sql, type SQL } from 'drizzle-orm';

import {
  db,
  hrEmployees,
  hrExpenses,
  type HrExpense,
  type NewHrExpense,
} from '@erp/db';

export type ExpenseWithEmployee = HrExpense & {
  employeeFirstName: string;
  employeeLastName: string;
};

@Injectable()
export class ExpensesRepository {
  listByTenant(tenantId: string) {
    return this.selectExpenses(
      and(eq(hrExpenses.tenantId, tenantId), eq(hrExpenses.expenseType, 'TADA')),
    );
  }

  listByEmployee(tenantId: string, employeeId: string) {
    return this.selectExpenses(
      and(
        eq(hrExpenses.tenantId, tenantId),
        eq(hrExpenses.employeeId, employeeId),
        eq(hrExpenses.expenseType, 'TADA'),
      ),
    );
  }

  async findById(
    tenantId: string,
    expenseId: string,
  ): Promise<ExpenseWithEmployee | null> {
    const [row] = await this.selectExpenses(
      and(eq(hrExpenses.id, expenseId), eq(hrExpenses.tenantId, tenantId)),
    );

    return row ?? null;
  }

  async create(values: NewHrExpense): Promise<HrExpense> {
    const [row] = await db.insert(hrExpenses).values(values).returning();

    if (!row) {
      throw new Error('TADA_CREATE_FAILED');
    }

    return row;
  }

  async update(
    tenantId: string,
    expenseId: string,
    values: Partial<NewHrExpense>,
  ): Promise<HrExpense | null> {
    const [row] = await db
      .update(hrExpenses)
      .set({ ...values, updatedAt: new Date() })
      .where(
        and(eq(hrExpenses.id, expenseId), eq(hrExpenses.tenantId, tenantId)),
      )
      .returning();

    return row ?? null;
  }

  private async selectExpenses(
    where: SQL | undefined,
  ): Promise<ExpenseWithEmployee[]> {
    const rows = await db
      .select({
        expense: hrExpenses,
        employeeFirstName: hrEmployees.firstName,
        employeeLastName: hrEmployees.lastName,
      })
      .from(hrExpenses)
      .innerJoin(hrEmployees, eq(hrEmployees.id, hrExpenses.employeeId))
      .where(where)
      .orderBy(
        sql`case when ${hrExpenses.status} = 'PENDING' then 0 else 1 end`,
        desc(hrExpenses.createdAt),
      );

    return rows.map((row) => ({
      ...row.expense,
      employeeFirstName: row.employeeFirstName,
      employeeLastName: row.employeeLastName,
    }));
  }
}
