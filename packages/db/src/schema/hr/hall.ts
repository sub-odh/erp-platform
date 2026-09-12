import {
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { organizations } from "../organization";
import { users } from "../user";
import { hrEmployees } from "./employee";

export const hallStatusEnum = pgEnum("hr_hall_status", [
  "ACTIVE",
  "MAINTENANCE",
]);

export const hallArrangementEnum = pgEnum("hr_hall_arrangement", [
  "THEATER",
  "U_SHAPE",
  "BOARDROOM",
  "CLASSROOM",
]);

export const hallBookingStatusEnum = pgEnum("hr_hall_booking_status", [
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
]);

export const hrMeetingHalls = pgTable(
  "hr_meeting_halls",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    hallName: varchar("hall_name", { length: 100 }).notNull(),
    location: varchar("location", { length: 100 }),
    capacity: integer("capacity"),
    arrangementType: hallArrangementEnum("arrangement_type")
      .default("BOARDROOM")
      .notNull(),
    status: hallStatusEnum("status").default("ACTIVE").notNull(),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    tenantNameIndex: index("hr_meeting_halls_tenant_name_idx").on(
      table.tenantId,
      table.hallName,
    ),
  }),
);

export const hrHallBookings = pgTable(
  "hr_hall_bookings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    hallId: uuid("hall_id")
      .notNull()
      .references(() => hrMeetingHalls.id, { onDelete: "cascade" }),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => hrEmployees.id, { onDelete: "cascade" }),
    bookingDate: date("booking_date").notNull(),
    startTime: varchar("start_time", { length: 8 }).notNull(),
    endTime: varchar("end_time", { length: 8 }).notNull(),
    reason: text("reason"),
    status: hallBookingStatusEnum("status").default("PENDING").notNull(),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    tenantHallDateIndex: index("hr_hall_bookings_tenant_hall_date_idx").on(
      table.tenantId,
      table.hallId,
      table.bookingDate,
    ),
  }),
);

export type HrMeetingHall = typeof hrMeetingHalls.$inferSelect;
export type NewHrMeetingHall = typeof hrMeetingHalls.$inferInsert;
export type HrHallBooking = typeof hrHallBookings.$inferSelect;
export type NewHrHallBooking = typeof hrHallBookings.$inferInsert;
