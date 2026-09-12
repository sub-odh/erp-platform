import {
  date,
  index,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { organizations } from "../organization";
import { users } from "../user";
import { hrEmployees } from "./employee";

export const hrAttendance = pgTable(
  "hr_attendance",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => hrEmployees.id, { onDelete: "cascade" }),
    punchDate: date("punch_date").notNull(),
    inTime: varchar("in_time", { length: 8 }),
    outTime: varchar("out_time", { length: 8 }),
    duration: varchar("duration", { length: 20 }),
    attStatus: varchar("att_status", { length: 100 }).notNull(),
    source: varchar("source", { length: 20 }).default("MANUAL").notNull(),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    updatedBy: uuid("updated_by").references(() => users.id, {
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
    tenantEmployeeDateUnique: uniqueIndex(
      "hr_attendance_tenant_employee_date_unique",
    ).on(table.tenantId, table.employeeId, table.punchDate),
    tenantDateIndex: index("hr_attendance_tenant_date_idx").on(
      table.tenantId,
      table.punchDate,
    ),
    tenantEmployeeIndex: index("hr_attendance_tenant_employee_idx").on(
      table.tenantId,
      table.employeeId,
    ),
  }),
);

export type HrAttendance = typeof hrAttendance.$inferSelect;
export type NewHrAttendance = typeof hrAttendance.$inferInsert;
