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

export const operationsUnits = pgTable(
  "ops_units",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    symbol: varchar("symbol", { length: 30 }).notNull(),
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
    tenantNameUnique: uniqueIndex("ops_units_tenant_name_unique")
      .on(table.tenantId, table.name)
      .where(sql`${table.deletedAt} is null`),
    tenantSymbolUnique: uniqueIndex("ops_units_tenant_symbol_unique")
      .on(table.tenantId, table.symbol)
      .where(sql`${table.deletedAt} is null`),
    tenantIndex: index("ops_units_tenant_idx").on(table.tenantId),
  }),
);

export type OperationsUnit = typeof operationsUnits.$inferSelect;
export type NewOperationsUnit = typeof operationsUnits.$inferInsert;
