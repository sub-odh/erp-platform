import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { organizations } from "../organization";
import { users } from "../user";
import { inventoryAssets } from "./inventory-asset";

export const inventoryMovementTypeEnum = pgEnum("ops_inventory_movement_type", [
  "ADDITION",
  "ADJUSTMENT",
  "REMOVAL",
  "RETURN",
  "SALE",
  "DAMAGE",
]);

export const inventoryMovements = pgTable(
  "ops_inventory_movements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    assetId: uuid("asset_id")
      .notNull()
      .references(() => inventoryAssets.id, { onDelete: "cascade" }),
    type: inventoryMovementTypeEnum("type").notNull(),
    quantityDelta: integer("quantity_delta").notNull(),
    stockQuantityAfter: integer("stock_quantity_after").notNull(),
    remarks: text("remarks"),
    performedBy: uuid("performed_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    tenantIndex: index("ops_inventory_movements_tenant_idx").on(table.tenantId),
    assetIndex: index("ops_inventory_movements_asset_idx").on(table.assetId),
    tenantCreatedAtIndex: index(
      "ops_inventory_movements_tenant_created_at_idx",
    ).on(table.tenantId, table.createdAt),
  }),
);

export type InventoryMovement = typeof inventoryMovements.$inferSelect;
export type NewInventoryMovement = typeof inventoryMovements.$inferInsert;
export type InventoryMovementType =
  (typeof inventoryMovementTypeEnum.enumValues)[number];
