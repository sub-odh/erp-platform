import { Injectable } from '@nestjs/common';
import { and, asc, desc, eq, inArray } from 'drizzle-orm';

import {
  db,
  hrEmployees,
  hrHallBookings,
  hrMeetingHalls,
  type HrHallBooking,
  type HrMeetingHall,
  type NewHrHallBooking,
  type NewHrMeetingHall,
} from '@erp/db';

export interface HallBookingRecord {
  booking: HrHallBooking;
  hallName: string;
  employeeFirstName: string;
  employeeLastName: string;
}

const ACTIVE_BOOKING_STATUSES = ['PENDING', 'CONFIRMED'] as const;

@Injectable()
export class HallsRepository {
  listHalls(tenantId: string): Promise<HrMeetingHall[]> {
    return db
      .select()
      .from(hrMeetingHalls)
      .where(eq(hrMeetingHalls.tenantId, tenantId))
      .orderBy(asc(hrMeetingHalls.hallName));
  }

  async findHall(
    tenantId: string,
    hallId: string,
  ): Promise<HrMeetingHall | null> {
    const [row] = await db
      .select()
      .from(hrMeetingHalls)
      .where(
        and(eq(hrMeetingHalls.id, hallId), eq(hrMeetingHalls.tenantId, tenantId)),
      )
      .limit(1);

    return row ?? null;
  }

  async createHall(values: NewHrMeetingHall): Promise<HrMeetingHall> {
    const [row] = await db.insert(hrMeetingHalls).values(values).returning();

    if (!row) {
      throw new Error('HALL_CREATE_FAILED');
    }

    return row;
  }

  async updateHall(
    tenantId: string,
    hallId: string,
    values: Partial<NewHrMeetingHall>,
  ): Promise<HrMeetingHall | null> {
    const [row] = await db
      .update(hrMeetingHalls)
      .set({ ...values, updatedAt: new Date() })
      .where(
        and(eq(hrMeetingHalls.id, hallId), eq(hrMeetingHalls.tenantId, tenantId)),
      )
      .returning();

    return row ?? null;
  }

  async deleteHall(tenantId: string, hallId: string): Promise<boolean> {
    const deleted = await db
      .delete(hrMeetingHalls)
      .where(
        and(eq(hrMeetingHalls.id, hallId), eq(hrMeetingHalls.tenantId, tenantId)),
      )
      .returning({ id: hrMeetingHalls.id });

    return deleted.length > 0;
  }

  listActiveForHallDate(
    tenantId: string,
    hallId: string,
    bookingDate: string,
  ): Promise<HrHallBooking[]> {
    return db
      .select()
      .from(hrHallBookings)
      .where(
        and(
          eq(hrHallBookings.tenantId, tenantId),
          eq(hrHallBookings.hallId, hallId),
          eq(hrHallBookings.bookingDate, bookingDate),
          inArray(hrHallBookings.status, [...ACTIVE_BOOKING_STATUSES]),
        ),
      );
  }

  async listBookings(
    tenantId: string,
    employeeId?: string,
  ): Promise<HallBookingRecord[]> {
    const rows = await this.bookingQuery()
      .where(
        employeeId
          ? and(
              eq(hrHallBookings.tenantId, tenantId),
              eq(hrHallBookings.employeeId, employeeId),
            )
          : eq(hrHallBookings.tenantId, tenantId),
      )
      .orderBy(
        desc(hrHallBookings.bookingDate),
        asc(hrHallBookings.startTime),
      );

    return rows.map((row) => this.toBookingRecord(row));
  }

  async findBooking(
    tenantId: string,
    bookingId: string,
  ): Promise<HallBookingRecord | null> {
    const [row] = await this.bookingQuery()
      .where(
        and(
          eq(hrHallBookings.id, bookingId),
          eq(hrHallBookings.tenantId, tenantId),
        ),
      )
      .limit(1);

    return row ? this.toBookingRecord(row) : null;
  }

  async createBooking(values: NewHrHallBooking): Promise<HrHallBooking> {
    const [row] = await db.insert(hrHallBookings).values(values).returning();

    if (!row) {
      throw new Error('HALL_BOOKING_CREATE_FAILED');
    }

    return row;
  }

  async updateBooking(
    tenantId: string,
    bookingId: string,
    values: Partial<NewHrHallBooking>,
  ): Promise<HrHallBooking | null> {
    const [row] = await db
      .update(hrHallBookings)
      .set({ ...values, updatedAt: new Date() })
      .where(
        and(
          eq(hrHallBookings.id, bookingId),
          eq(hrHallBookings.tenantId, tenantId),
        ),
      )
      .returning();

    return row ?? null;
  }

  private bookingQuery() {
    return db
      .select({
        booking: hrHallBookings,
        hallName: hrMeetingHalls.hallName,
        employeeFirstName: hrEmployees.firstName,
        employeeLastName: hrEmployees.lastName,
      })
      .from(hrHallBookings)
      .innerJoin(hrMeetingHalls, eq(hrHallBookings.hallId, hrMeetingHalls.id))
      .innerJoin(hrEmployees, eq(hrHallBookings.employeeId, hrEmployees.id));
  }

  private toBookingRecord(row: {
    booking: HrHallBooking;
    hallName: string;
    employeeFirstName: string;
    employeeLastName: string;
  }): HallBookingRecord {
    return row;
  }
}
