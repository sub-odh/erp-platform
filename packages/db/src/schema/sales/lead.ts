import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { organizations } from "../organization";
import { users } from "../user";

export const salesLeadStatusEnum = pgEnum("sales_lead_status", [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "DISQUALIFIED",
  "CONVERTED",
]);

export const salesLeads = pgTable(
  "sales_leads",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => organizations.id, {
        onDelete: "cascade",
      }),

    firstName: varchar("first_name", {
      length: 100,
    }).notNull(),

    lastName: varchar("last_name", {
      length: 100,
    }).notNull(),

    companyName: varchar("company_name", {
      length: 200,
    }),

    jobTitle: varchar("job_title", {
      length: 150,
    }),

    email: varchar("email", {
      length: 320,
    }),

    phone: varchar("phone", {
      length: 50,
    }),

    mobile: varchar("mobile", {
      length: 50,
    }),

    source: varchar("source", {
      length: 100,
    }),

    status: salesLeadStatusEnum("status").notNull().default("NEW"),

    ownerUserId: uuid("owner_user_id").references(() => users.id, {
      onDelete: "set null",
    }),

    notes: text("notes"),

    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),

    updatedBy: uuid("updated_by").references(() => users.id, {
      onDelete: "set null",
    }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    convertedAt: timestamp("converted_at", {
      withTimezone: true,
    }),

    deletedAt: timestamp("deleted_at", {
      withTimezone: true,
    }),
  },
  (table) => ({
    tenantIndex: index("sales_leads_tenant_idx").on(table.tenantId),

    tenantStatusIndex: index("sales_leads_tenant_status_idx").on(
      table.tenantId,
      table.status,
    ),

    tenantOwnerIndex: index("sales_leads_tenant_owner_idx").on(
      table.tenantId,
      table.ownerUserId,
    ),

    tenantEmailIndex: index("sales_leads_tenant_email_idx").on(
      table.tenantId,
      table.email,
    ),

    tenantCreatedAtIndex: index("sales_leads_tenant_created_at_idx").on(
      table.tenantId,
      table.createdAt,
    ),
  }),
);

export type SalesLead = typeof salesLeads.$inferSelect;

export type NewSalesLead = typeof salesLeads.$inferInsert;

export type SalesLeadStatus = (typeof salesLeadStatusEnum.enumValues)[number];
