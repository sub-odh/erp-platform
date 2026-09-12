import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  foreignKey,
  index,
  integer,
  numeric,
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

export const employeeGenderEnum = pgEnum("hr_employee_gender", [
  "MALE",
  "FEMALE",
  "OTHERS",
]);

export const employeeMaritalStatusEnum = pgEnum("hr_employee_marital_status", [
  "SINGLE",
  "MARRIED",
]);

export const employeeStatusEnum = pgEnum("hr_employee_status", [
  "ACTIVE",
  "INACTIVE",
]);

export const hrEmployees = pgTable(
  "hr_employees",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    employeeCode: varchar("employee_code", { length: 50 }).notNull(),
    attendanceDeviceId: integer("attendance_device_id"),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    fatherName: varchar("father_name", { length: 255 }),
    motherName: varchar("mother_name", { length: 255 }),
    dateOfBirth: date("date_of_birth"),
    gender: employeeGenderEnum("gender"),
    maritalStatus: employeeMaritalStatusEnum("marital_status").default(
      "SINGLE",
    ),
    spouseName: varchar("spouse_name", { length: 255 }),
    workEmail: varchar("work_email", { length: 320 }),
    phone: varchar("phone", { length: 50 }),
    altPhone: varchar("alt_phone", { length: 50 }),
    emergencyContactName: varchar("emergency_contact_name", { length: 255 }),
    emergencyContactPhone: varchar("emergency_contact_phone", { length: 50 }),
    emergencyContactRelation: varchar("emergency_contact_relation", {
      length: 100,
    }),
    citizenshipNumber: varchar("citizenship_number", { length: 100 }),
    panNumber: varchar("pan_number", { length: 100 }),
    permanentAddress: text("permanent_address"),
    currentAddress: text("current_address"),
    bankName: varchar("bank_name", { length: 255 }),
    bankBranch: varchar("bank_branch", { length: 255 }),
    bankAccountName: varchar("bank_account_name", { length: 255 }),
    bankAccountNumber: varchar("bank_account_number", { length: 100 }),
    joinDate: date("join_date"),
    resignationDate: date("resignation_date"),
    designation: varchar("designation", { length: 100 }),
    department: varchar("department", { length: 100 }),
    qualification: text("qualification"),
    pastExperience: text("past_experience"),
    salary: numeric("salary", { precision: 15, scale: 2 }),
    annualLeaveBal: numeric("annual_leave_bal", { precision: 5, scale: 2 })
      .default("21.00")
      .notNull(),
    sickLeaveBal: numeric("sick_leave_bal", { precision: 5, scale: 2 })
      .default("15.00")
      .notNull(),
    casualLeaveBal: numeric("casual_leave_bal", { precision: 5, scale: 2 })
      .default("12.00")
      .notNull(),
    annualLeaveEnabled: boolean("annual_leave_enabled").default(true).notNull(),
    managerId: uuid("manager_id"),
    lastIncrementMonth: varchar("last_increment_month", { length: 7 }),
    hasSalesTarget: boolean("has_sales_target").default(false).notNull(),
    salesTarget: numeric("sales_target", { precision: 15, scale: 2 }),
    yearlySalesTarget: numeric("yearly_sales_target", {
      precision: 15,
      scale: 2,
    }),
    targetStartDate: date("target_start_date"),
    targetEndDate: date("target_end_date"),
    status: employeeStatusEnum("status").default("ACTIVE").notNull(),
    photoUrl: varchar("photo_url", { length: 1000 }),
    photoFileName: varchar("photo_file_name", { length: 255 }),
    photoMimeType: varchar("photo_mime_type", { length: 100 }),
    photoSize: integer("photo_size"),
    signatureUrl: varchar("signature_url", { length: 1000 }),
    signatureFileName: varchar("signature_file_name", { length: 255 }),
    signatureMimeType: varchar("signature_mime_type", { length: 100 }),
    signatureSize: integer("signature_size"),
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
    tenantCodeUnique: uniqueIndex("hr_employees_tenant_code_unique").on(
      table.tenantId,
      table.employeeCode,
    ),
    tenantUserUnique: uniqueIndex("hr_employees_tenant_user_unique").on(
      table.tenantId,
      table.userId,
    ),
    tenantDeviceUnique: uniqueIndex("hr_employees_tenant_device_unique").on(
      table.tenantId,
      table.attendanceDeviceId,
    ),
    tenantStatusIndex: index("hr_employees_tenant_status_idx").on(
      table.tenantId,
      table.status,
    ),
    tenantDepartmentIndex: index("hr_employees_tenant_department_idx").on(
      table.tenantId,
      table.department,
    ),
    managerForeignKey: foreignKey({
      name: "hr_employees_manager_id_fk",
      columns: [table.managerId],
      foreignColumns: [table.id],
    }).onDelete("set null"),
  }),
);

export const hrEmployeesRelations = relations(hrEmployees, ({ one }) => ({
  organization: one(organizations, {
    fields: [hrEmployees.tenantId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [hrEmployees.userId],
    references: [users.id],
  }),
  manager: one(hrEmployees, {
    fields: [hrEmployees.managerId],
    references: [hrEmployees.id],
    relationName: "employeeManager",
  }),
}));

export type HrEmployee = typeof hrEmployees.$inferSelect;
export type NewHrEmployee = typeof hrEmployees.$inferInsert;
