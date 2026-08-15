import {
  date,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { organizations } from "../organization";
import { users } from "../user";

export const inventoryAssetStatusEnum = pgEnum("ops_inventory_asset_status", [
  "IN_STOCK",
  "SOLD",
  "OUT_OF_STOCK",
  "DELIVERED",
  "DAMAGED",
  "RETURNED",
  "RMA",
  "AVAILABLE",
  "IN_USE",
  "POC_LOAN",
]);

export const inventoryAssets = pgTable(
  "ops_inventory_assets",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    itemName: varchar("item_name", { length: 255 }).notNull(),
    category: varchar("category", { length: 150 }).notNull(),
    vendor: varchar("vendor", { length: 200 }),
    modelNumber: varchar("model_number", { length: 100 }),
    serialNumber: varchar("serial_number", { length: 150 }),
    purchaseSource: varchar("purchase_source", { length: 255 }),
    purchaseDate: date("purchase_date"),
    location: varchar("location", { length: 255 }),

    stockQuantity: integer("stock_quantity").notNull().default(1),
    soldQuantity: integer("sold_quantity").notNull().default(0),
    damagedQuantity: integer("damaged_quantity").notNull().default(0),

    purchasePrice: numeric("purchase_price", { precision: 18, scale: 2 })
      .notNull()
      .default("0.00"),
    mrpPrice: numeric("mrp_price", { precision: 18, scale: 2 })
      .notNull()
      .default("0.00"),

    status: inventoryAssetStatusEnum("status").notNull().default("IN_STOCK"),
    clientName: varchar("client_name", { length: 255 }),
    deliveryDate: timestamp("delivery_date", { withTimezone: true }),
    assignedUserName: varchar("assigned_user_name", { length: 255 }),
    assignedUserContact: varchar("assigned_user_contact", { length: 255 }),
    assignedDate: date("assigned_date"),
    purpose: text("purpose"),
    notes: text("notes"),

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
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => ({
    tenantIndex: index("ops_inventory_assets_tenant_idx").on(table.tenantId),
    tenantStatusIndex: index("ops_inventory_assets_tenant_status_idx").on(
      table.tenantId,
      table.status,
    ),
    tenantVendorIndex: index("ops_inventory_assets_tenant_vendor_idx").on(
      table.tenantId,
      table.vendor,
    ),
    tenantItemIndex: index("ops_inventory_assets_tenant_item_idx").on(
      table.tenantId,
      table.itemName,
    ),
    tenantSerialIndex: index("ops_inventory_assets_tenant_serial_idx").on(
      table.tenantId,
      table.serialNumber,
    ),
  }),
);

export type InventoryAsset = typeof inventoryAssets.$inferSelect;
export type NewInventoryAsset = typeof inventoryAssets.$inferInsert;
export type InventoryAssetStatus =
  (typeof inventoryAssetStatusEnum.enumValues)[number];
