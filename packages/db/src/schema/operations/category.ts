import {
  boolean,
  index,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import { organizations } from "../organization";
import { users } from "../user";

export const operationsCategories = pgTable(
  "ops_categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    code: varchar("code", { length: 50 }).notNull(),
    name: varchar("name", { length: 150 }).notNull(),
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
    tenantCodeUnique: uniqueIndex("ops_categories_tenant_code_unique")
      .on(table.tenantId, table.code)
      .where(sql`${table.deletedAt} is null`),
    tenantNameUnique: uniqueIndex("ops_categories_tenant_name_unique")
      .on(table.tenantId, table.name)
      .where(sql`${table.deletedAt} is null`),
    tenantIndex: index("ops_categories_tenant_idx").on(table.tenantId),
  }),
);

export type OperationsCategory = typeof operationsCategories.$inferSelect;
export type NewOperationsCategory = typeof operationsCategories.$inferInsert;
