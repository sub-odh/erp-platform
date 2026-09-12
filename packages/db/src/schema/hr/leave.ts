import {
  boolean,
  date,
  index,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { organizations } from "../organization";
import { users } from "../user";
import { hrEmployees } from "./employee";

export const leaveTypeCodeEnum = pgEnum("hr_leave_type_code", [
  "ANNUAL",
  "SICK",
  "CASUAL",
]);

export const leaveRequestStatusEnum = pgEnum("hr_leave_request_status", [
  "PENDING",
  "APPROVED",
  "REJECTED",
]);

export const hrLeaveRequests = pgTable(
  "hr_leave_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => hrEmployees.id, { onDelete: "cascade" }),
    leaveType: leaveTypeCodeEnum("leave_type").notNull(),
    substituteId: uuid("substitute_id").references(() => hrEmployees.id, {
      onDelete: "set null",
    }),
    referredBy: uuid("referred_by").references(() => hrEmployees.id, {
      onDelete: "set null",
    }),
    peerVouched: boolean("peer_vouched").default(false).notNull(),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    days: numeric("days", { precision: 4, scale: 2 }).notNull(),
    isHalfDay: boolean("is_half_day").default(false).notNull(),
    reason: text("reason"),
    status: leaveRequestStatusEnum("status").default("PENDING").notNull(),
    approvedBy: uuid("approved_by").references(() => users.id, {
      onDelete: "set null",
    }),
    adminComment: text("admin_comment"),
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
    tenantStatusIndex: index("hr_leave_requests_tenant_status_idx").on(
      table.tenantId,
      table.status,
    ),
    tenantEmployeeIndex: index("hr_leave_requests_tenant_employee_idx").on(
      table.tenantId,
      table.employeeId,
    ),
    tenantDatesIndex: index("hr_leave_requests_tenant_dates_idx").on(
      table.tenantId,
      table.startDate,
      table.endDate,
    ),
  }),
);

export type HrLeaveRequest = typeof hrLeaveRequests.$inferSelect;
export type NewHrLeaveRequest = typeof hrLeaveRequests.$inferInsert;
