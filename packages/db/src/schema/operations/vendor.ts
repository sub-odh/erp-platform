import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import { organizations } from "../organization";
import { users } from "../user";

export const operationsVendors = pgTable(
  "ops_vendors",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    code: varchar("code", { length: 50 }).notNull(),
    name: varchar("name", { length: 200 }).notNull(),
    contactPerson: varchar("contact_person", { length: 200 }),
    email: varchar("email", { length: 320 }),
    phone: varchar("phone", { length: 50 }),
    taxNumber: varchar("tax_number", { length: 100 }),
    address: text("address"),
    paymentTermsDays: integer("payment_terms_days").notNull().default(0),
    notes: text("notes"),
    isActive: boolean("is_active").notNull().default(true),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    updatedBy: uuid("updated_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => ({
    tenantCodeUnique: uniqueIndex("ops_vendors_tenant_code_unique")
      .on(table.tenantId, table.code)
      .where(sql`${table.deletedAt} is null`),
    tenantNameIndex: index("ops_vendors_tenant_name_idx").on(
      table.tenantId,
      table.name,
    ),
    tenantActiveIndex: index("ops_vendors_tenant_active_idx").on(
      table.tenantId,
      table.isActive,
    ),
  }),
);

export type OperationsVendor = typeof operationsVendors.$inferSelect;
export type NewOperationsVendor = typeof operationsVendors.$inferInsert;
