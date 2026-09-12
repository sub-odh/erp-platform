import { Injectable } from '@nestjs/common';
import { and, desc, eq, sql, type SQL } from 'drizzle-orm';

import {
  db,
  hrEmployees,
  hrFuelRecords,
  hrFuelSettings,
  type HrFuelRecord,
  type HrFuelSettings,
  type NewHrFuelRecord,
} from '@erp/db';

export type FuelRecordWithEmployee = HrFuelRecord & {
  employeeFirstName: string;
  employeeLastName: string;
};

export const DEFAULT_FUEL_THRESHOLD = 250;

@Injectable()
export class FuelRepository {
  listByTenant(tenantId: string) {
    return this.selectRecords(eq(hrFuelRecords.tenantId, tenantId));
  }

  listByEmployee(tenantId: string, employeeId: string) {
    return this.selectRecords(
      and(
        eq(hrFuelRecords.tenantId, tenantId),
        eq(hrFuelRecords.employeeId, employeeId),
      ),
    );
  }

  async findById(
    tenantId: string,
    recordId: string,
  ): Promise<FuelRecordWithEmployee | null> {
    const [row] = await this.selectRecords(
      and(eq(hrFuelRecords.id, recordId), eq(hrFuelRecords.tenantId, tenantId)),
    );

    return row ?? null;
  }

  async create(values: NewHrFuelRecord): Promise<HrFuelRecord> {
    const [row] = await db.insert(hrFuelRecords).values(values).returning();

    if (!row) {
      throw new Error('FUEL_CREATE_FAILED');
    }

    return row;
  }

  async update(
    tenantId: string,
    recordId: string,
    values: Partial<NewHrFuelRecord>,
  ): Promise<HrFuelRecord | null> {
    const [row] = await db
      .update(hrFuelRecords)
      .set({ ...values, updatedAt: new Date() })
      .where(
        and(eq(hrFuelRecords.id, recordId), eq(hrFuelRecords.tenantId, tenantId)),
      )
      .returning();

    return row ?? null;
  }

  async totals(tenantId: string) {
    const [row] = await db
      .select({
        liters: sql<string>`coalesce(sum(${hrFuelRecords.liters}::numeric), 0)::numeric`,
        amount: sql<string>`coalesce(sum(${hrFuelRecords.amount}::numeric), 0)::numeric`,
      })
      .from(hrFuelRecords)
      .where(eq(hrFuelRecords.tenantId, tenantId));

    return {
      liters: row?.liters ?? '0',
      amount: row?.amount ?? '0',
    };
  }

  async getSettings(tenantId: string): Promise<HrFuelSettings | null> {
    const [row] = await db
      .select()
      .from(hrFuelSettings)
      .where(eq(hrFuelSettings.tenantId, tenantId))
      .limit(1);

    return row ?? null;
  }

  async upsertSettings(
    tenantId: string,
    threshold: string,
    updatedBy: string,
  ): Promise<HrFuelSettings> {
    const [row] = await db
      .insert(hrFuelSettings)
      .values({
        tenantId,
        threshold,
        updatedBy,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: hrFuelSettings.tenantId,
        set: {
          threshold,
          updatedBy,
          updatedAt: new Date(),
        },
      })
      .returning();

    if (!row) {
      throw new Error('FUEL_SETTINGS_UPSERT_FAILED');
    }

    return row;
  }

  private async selectRecords(
    where: SQL | undefined,
  ): Promise<FuelRecordWithEmployee[]> {
    const rows = await db
      .select({
        record: hrFuelRecords,
        employeeFirstName: hrEmployees.firstName,
        employeeLastName: hrEmployees.lastName,
      })
      .from(hrFuelRecords)
      .innerJoin(hrEmployees, eq(hrEmployees.id, hrFuelRecords.employeeId))
      .where(where)
      .orderBy(
        sql`case when ${hrFuelRecords.status} in ('PENDING', 'FLAGGED') then 0 else 1 end`,
        desc(hrFuelRecords.createdAt),
      );

    return rows.map((row) => ({
      ...row.record,
      employeeFirstName: row.employeeFirstName,
      employeeLastName: row.employeeLastName,
    }));
  }
}
