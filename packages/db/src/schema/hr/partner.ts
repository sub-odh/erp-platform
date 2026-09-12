import {
  index,
  integer,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { organizations } from "../organization";
import { users } from "../user";
import { hrEmployees } from "./employee";

export const hrPartners = pgTable(
  "hr_partners",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    portalUrl: varchar("portal_url", { length: 500 }),
    websiteUrl: varchar("website_url", { length: 500 }),
    logoUrl: varchar("logo_url", { length: 1000 }),
    logoFileName: varchar("logo_file_name", { length: 255 }),
    logoMimeType: varchar("logo_mime_type", { length: 100 }),
    logoSize: integer("logo_size"),
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
    tenantNameIndex: index("hr_partners_tenant_name_idx").on(
      table.tenantId,
      table.name,
    ),
  }),
);

export const hrPartnerAssignments = pgTable(
  "hr_partner_assignments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    partnerId: uuid("partner_id")
      .notNull()
      .references(() => hrPartners.id, { onDelete: "cascade" }),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => hrEmployees.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    tenantPartnerEmployeeUnique: uniqueIndex(
      "hr_partner_assignments_unique",
    ).on(table.tenantId, table.partnerId, table.employeeId),
  }),
);

export type HrPartner = typeof hrPartners.$inferSelect;
export type NewHrPartner = typeof hrPartners.$inferInsert;
export type HrPartnerAssignment = typeof hrPartnerAssignments.$inferSelect;
export type NewHrPartnerAssignment = typeof hrPartnerAssignments.$inferInsert;
