import {
  boolean,
  index,
  integer,
  numeric,
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
import { operationsCategories } from "./category";
import { operationsUnits } from "./unit";
import { operationsVendors } from "./vendor";

export const operationsProducts = pgTable(
  "ops_products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    sku: varchar("sku", { length: 80 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => operationsCategories.id, { onDelete: "restrict" }),
    unitId: uuid("unit_id")
      .notNull()
      .references(() => operationsUnits.id, { onDelete: "restrict" }),
    defaultVendorId: uuid("default_vendor_id").references(
      () => operationsVendors.id,
      { onDelete: "set null" },
    ),
    description: text("description"),
    purchasePrice: numeric("purchase_price", { precision: 18, scale: 2 })
      .notNull()
      .default("0.00"),
    sellingPrice: numeric("selling_price", { precision: 18, scale: 2 })
      .notNull()
      .default("0.00"),
    reorderLevel: integer("reorder_level").notNull().default(0),
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
    tenantSkuUnique: uniqueIndex("ops_products_tenant_sku_unique")
      .on(table.tenantId, table.sku)
      .where(sql`${table.deletedAt} is null`),
    tenantNameIndex: index("ops_products_tenant_name_idx").on(
      table.tenantId,
      table.name,
    ),
    tenantCategoryIndex: index("ops_products_tenant_category_idx").on(
      table.tenantId,
      table.categoryId,
    ),
    tenantActiveIndex: index("ops_products_tenant_active_idx").on(
      table.tenantId,
      table.isActive,
    ),
  }),
);

export type OperationsProduct = typeof operationsProducts.$inferSelect;
export type NewOperationsProduct = typeof operationsProducts.$inferInsert;
