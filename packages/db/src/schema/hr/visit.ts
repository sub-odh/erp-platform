import {
  date,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { organizations } from "../organization";
import { users } from "../user";
import { salesCustomers } from "../sales/customer";
import { hrEmployees } from "./employee";

export const supportVisitTypeEnum = pgEnum("hr_support_visit_type", [
  "REMOTE",
  "ONCALL",
  "ONPREMISE",
]);

export const supportVisitStatusEnum = pgEnum("hr_support_visit_status", [
  "PENDING",
  "ONGOING",
  "RESOLVED",
  "ESCALATED",
]);

export const fieldVisitTypeEnum = pgEnum("hr_field_visit_type", [
  "CLIENT_MEETING",
  "TECHNICAL_SUPPORT",
  "BANK",
  "CUSTOMS",
  "OTHER",
]);

export const hrSupportVisits = pgTable(
  "hr_support_visits",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    visitNumber: varchar("visit_number", { length: 30 }).notNull(),
    customerId: uuid("customer_id").references(() => salesCustomers.id, {
      onDelete: "set null",
    }),
    clientName: varchar("client_name", { length: 255 }).notNull(),
    deptName: varchar("dept_name", { length: 100 }),
    technicianId: uuid("technician_id").references(() => hrEmployees.id, {
      onDelete: "set null",
    }),
    teamMembers: text("team_members"),
    visitDate: date("visit_date").notNull(),
    clientCallTime: varchar("client_call_time", { length: 8 }),
    timeStarted: varchar("time_started", { length: 8 }),
    timeEnded: varchar("time_ended", { length: 8 }),
    totalHours: varchar("total_hours", { length: 20 }),
    visitType: supportVisitTypeEnum("visit_type").default("ONPREMISE").notNull(),
    category: varchar("category", { length: 100 }),
    priority: varchar("priority", { length: 50 }),
    issueDescription: text("issue_description"),
    actionTaken: text("action_taken"),
    partsUsed: text("parts_used"),
    status: supportVisitStatusEnum("status").default("PENDING").notNull(),
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
    tenantVisitNumberUnique: uniqueIndex(
      "hr_support_visits_tenant_number_unique",
    ).on(table.tenantId, table.visitNumber),
    tenantDateIndex: index("hr_support_visits_tenant_date_idx").on(
      table.tenantId,
      table.visitDate,
    ),
    tenantTechnicianIndex: index("hr_support_visits_tenant_tech_idx").on(
      table.tenantId,
      table.technicianId,
    ),
  }),
);

export const hrFieldVisits = pgTable(
  "hr_field_visits",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => hrEmployees.id, { onDelete: "cascade" }),
    agenda: varchar("agenda", { length: 255 }).notNull(),
    visitType: fieldVisitTypeEnum("visit_type").notNull(),
    outTime: varchar("out_time", { length: 8 }).notNull(),
    inTime: varchar("in_time", { length: 8 }),
    remarks: text("remarks"),
    visitDate: date("visit_date").notNull(),
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
    tenantEmployeeDateIndex: index("hr_field_visits_tenant_emp_date_idx").on(
      table.tenantId,
      table.employeeId,
      table.visitDate,
    ),
  }),
);

export type HrSupportVisit = typeof hrSupportVisits.$inferSelect;
export type NewHrSupportVisit = typeof hrSupportVisits.$inferInsert;
export type HrFieldVisit = typeof hrFieldVisits.$inferSelect;
export type NewHrFieldVisit = typeof hrFieldVisits.$inferInsert;
