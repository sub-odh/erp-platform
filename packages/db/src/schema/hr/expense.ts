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

export const expenseTypeEnum = pgEnum("hr_expense_type", ["TADA", "OTHER"]);

export const expenseStatusEnum = pgEnum("hr_expense_status", [
  "PENDING",
  "APPROVED",
  "REJECTED",
]);

export const reimbursementStatusEnum = pgEnum("hr_reimbursement_status", [
  "PENDING",
  "PAID",
]);

export const hrExpenses = pgTable(
  "hr_expenses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => hrEmployees.id, { onDelete: "cascade" }),
    expenseType: expenseTypeEnum("expense_type").notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    description: text("description"),
    requestDate: date("request_date").notNull(),
    origin: varchar("origin", { length: 100 }),
    destination: varchar("destination", { length: 100 }),
    status: expenseStatusEnum("status").default("PENDING").notNull(),
    approvedBy: uuid("approved_by").references(() => users.id, {
      onDelete: "set null",
    }),
    remarks: text("remarks"),
    reimbursementStatus: reimbursementStatusEnum("reimbursement_status")
      .default("PENDING")
      .notNull(),
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
    tenantTypeStatusIndex: index("hr_expenses_tenant_type_status_idx").on(
      table.tenantId,
      table.expenseType,
      table.status,
    ),
    tenantEmployeeIndex: index("hr_expenses_tenant_employee_idx").on(
      table.tenantId,
      table.employeeId,
    ),
  }),
);

export type HrExpense = typeof hrExpenses.$inferSelect;
export type NewHrExpense = typeof hrExpenses.$inferInsert;
