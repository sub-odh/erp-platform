import {
  date,
  index,
  numeric,
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

export const fuelStatusEnum = pgEnum("hr_fuel_status", [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "FLAGGED",
  "REIMBURSED",
]);

export const hrFuelSettings = pgTable("hr_fuel_settings", {
  tenantId: uuid("tenant_id")
    .primaryKey()
    .references(() => organizations.id, { onDelete: "cascade" }),
  threshold: numeric("threshold", { precision: 12, scale: 2 })
    .default("250.00")
    .notNull(),
  updatedBy: uuid("updated_by").references(() => users.id, {
    onDelete: "set null",
  }),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const hrFuelRecords = pgTable(
  "hr_fuel_records",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => hrEmployees.id, { onDelete: "cascade" }),
    vehicleNo: varchar("vehicle_no", { length: 50 }).notNull(),
    fuelDate: date("fuel_date").notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    liters: numeric("liters", { precision: 10, scale: 2 }).notNull(),
    purpose: text("purpose"),
    status: fuelStatusEnum("status").default("PENDING").notNull(),
    approvedBy: uuid("approved_by").references(() => users.id, {
      onDelete: "set null",
    }),
    reimbursementStatus: varchar("reimbursement_status", { length: 20 })
      .default("PENDING")
      .notNull(),
    reimbursedAt: timestamp("reimbursed_at", { withTimezone: true }),
    reimbursedBy: uuid("reimbursed_by").references(() => users.id, {
      onDelete: "set null",
    }),
    paymentReference: varchar("payment_reference", { length: 100 }),
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
    tenantStatusIndex: index("hr_fuel_records_tenant_status_idx").on(
      table.tenantId,
      table.status,
    ),
    tenantEmployeeIndex: index("hr_fuel_records_tenant_employee_idx").on(
      table.tenantId,
      table.employeeId,
    ),
  }),
);

export type HrFuelSettings = typeof hrFuelSettings.$inferSelect;
export type NewHrFuelSettings = typeof hrFuelSettings.$inferInsert;
export type HrFuelRecord = typeof hrFuelRecords.$inferSelect;
export type NewHrFuelRecord = typeof hrFuelRecords.$inferInsert;
