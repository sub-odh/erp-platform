import {
  date,
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

import { organizations } from "../organization";
import { users } from "../user";
import { inventoryAssets } from "./inventory-asset";

export const operationsDeliveryOrders = pgTable(
  "ops_delivery_orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    deliveryNumber: varchar("delivery_number", { length: 40 }).notNull(),
    deliveryDate: date("delivery_date").notNull(),
    customerName: varchar("customer_name", { length: 255 }).notNull(),
    contactName: varchar("contact_name", { length: 255 }),
    contactPhone: varchar("contact_phone", { length: 80 }),
    deliveryAddress: text("delivery_address"),
    notes: text("notes"),
    deliveredBy: uuid("delivered_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantNumberUnique: uniqueIndex(
      "ops_delivery_orders_tenant_number_unique",
    ).on(table.tenantId, table.deliveryNumber),
    tenantDateIndex: index("ops_delivery_orders_tenant_date_idx").on(
      table.tenantId,
      table.deliveryDate,
    ),
  }),
);

export const operationsDeliveryOrderItems = pgTable(
  "ops_delivery_order_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    deliveryOrderId: uuid("delivery_order_id")
      .notNull()
      .references(() => operationsDeliveryOrders.id, { onDelete: "cascade" }),
    assetId: uuid("asset_id")
      .notNull()
      .references(() => inventoryAssets.id, { onDelete: "restrict" }),
    itemName: varchar("item_name", { length: 255 }).notNull(),
    serialNumber: varchar("serial_number", { length: 150 }),
    quantity: integer("quantity").notNull(),
    unitPrice: numeric("unit_price", { precision: 18, scale: 2 })
      .notNull()
      .default("0.00"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    deliveryAssetUnique: uniqueIndex(
      "ops_delivery_order_items_delivery_asset_unique",
    ).on(table.deliveryOrderId, table.assetId),
    tenantDeliveryIndex: index(
      "ops_delivery_order_items_tenant_delivery_idx",
    ).on(table.tenantId, table.deliveryOrderId),
  }),
);

export type OperationsDeliveryOrder =
  typeof operationsDeliveryOrders.$inferSelect;
export type NewOperationsDeliveryOrder =
  typeof operationsDeliveryOrders.$inferInsert;
export type OperationsDeliveryOrderItem =
  typeof operationsDeliveryOrderItems.$inferSelect;
export type NewOperationsDeliveryOrderItem =
  typeof operationsDeliveryOrderItems.$inferInsert;
