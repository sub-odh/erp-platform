import { Injectable } from '@nestjs/common';
import { and, asc, eq } from 'drizzle-orm';

import { db, hrHolidays, type HrHoliday, type NewHrHoliday } from '@erp/db';

@Injectable()
export class HolidaysRepository {
  list(tenantId: string) {
    return db
      .select()
      .from(hrHolidays)
      .where(eq(hrHolidays.tenantId, tenantId))
      .orderBy(asc(hrHolidays.holidayDate), asc(hrHolidays.title));
  }

  async findById(tenantId: string, holidayId: string) {
    const [row] = await db
      .select()
      .from(hrHolidays)
      .where(
        and(eq(hrHolidays.id, holidayId), eq(hrHolidays.tenantId, tenantId)),
      )
      .limit(1);

    return row ?? null;
  }

  async findByDate(tenantId: string, holidayDate: string, excludeId?: string) {
    const [row] = await db
      .select()
      .from(hrHolidays)
      .where(
        and(
          eq(hrHolidays.tenantId, tenantId),
          eq(hrHolidays.holidayDate, holidayDate),
        ),
      )
      .limit(1);

    if (!row || row.id === excludeId) {
      return null;
    }

    return row;
  }

  async create(values: NewHrHoliday): Promise<HrHoliday> {
    const [row] = await db.insert(hrHolidays).values(values).returning();

    if (!row) {
      throw new Error('HOLIDAY_CREATE_FAILED');
    }

    return row;
  }

  async update(
    tenantId: string,
    holidayId: string,
    values: Partial<NewHrHoliday>,
  ): Promise<HrHoliday | null> {
    const [row] = await db
      .update(hrHolidays)
      .set({ ...values, updatedAt: new Date() })
      .where(
        and(eq(hrHolidays.id, holidayId), eq(hrHolidays.tenantId, tenantId)),
      )
      .returning();

    return row ?? null;
  }

  async delete(tenantId: string, holidayId: string): Promise<boolean> {
    const deleted = await db
      .delete(hrHolidays)
      .where(
        and(eq(hrHolidays.id, holidayId), eq(hrHolidays.tenantId, tenantId)),
      )
      .returning({ id: hrHolidays.id });

    return deleted.length > 0;
  }
}
