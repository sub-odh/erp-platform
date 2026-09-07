import {
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { organizations } from "../organization";
import { users } from "../user";
import { inventoryAssets } from "./inventory-asset";

export const operationsItemReturns = pgTable(
  "ops_item_returns",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    returnNumber: varchar("return_number", { length: 40 }).notNull(),
    assetId: uuid("asset_id")
      .notNull()
      .references(() => inventoryAssets.id, { onDelete: "restrict" }),
    returnDate: date("return_date").notNull(),
    customerName: varchar("customer_name", { length: 255 }),
    quantity: integer("quantity").notNull(),
    reason: varchar("reason", { length: 255 }),
    notes: text("notes"),
    receivedBy: uuid("received_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantNumberUnique: uniqueIndex("ops_item_returns_tenant_number_unique").on(
      table.tenantId,
      table.returnNumber,
    ),
    tenantDateIndex: index("ops_item_returns_tenant_date_idx").on(
      table.tenantId,
      table.returnDate,
    ),
  }),
);

export type OperationsItemReturn = typeof operationsItemReturns.$inferSelect;
export type NewOperationsItemReturn = typeof operationsItemReturns.$inferInsert;
