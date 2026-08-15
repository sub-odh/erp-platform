import {
  date,
  index,
  integer,
  numeric,
  pgEnum,
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
import { operationsProducts } from "./product";
import { operationsVendors } from "./vendor";

export const purchaseOrderStatusEnum = pgEnum("ops_purchase_order_status", [
  "DRAFT",
  "ISSUED",
  "PARTIALLY_RECEIVED",
  "RECEIVED",
  "CANCELLED",
]);

export const operationsPurchaseOrders = pgTable(
  "ops_purchase_orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    poNumber: varchar("po_number", { length: 40 }).notNull(),
    vendorId: uuid("vendor_id")
      .notNull()
      .references(() => operationsVendors.id, { onDelete: "restrict" }),
    poDate: date("po_date").notNull(),
    attentionContact: varchar("attention_contact", { length: 200 }),
    deliveryAddress: text("delivery_address"),
    paymentTerms: varchar("payment_terms", { length: 500 }),
    notes: text("notes"),
    status: purchaseOrderStatusEnum("status").notNull().default("ISSUED"),
    totalAmount: numeric("total_amount", { precision: 18, scale: 2 })
      .notNull()
      .default("0.00"),
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
    tenantPoNumberUnique: uniqueIndex(
      "ops_purchase_orders_tenant_number_unique",
    )
      .on(table.tenantId, table.poNumber)
      .where(sql`${table.deletedAt} is null`),
    tenantDateIndex: index("ops_purchase_orders_tenant_date_idx").on(
      table.tenantId,
      table.poDate,
    ),
    tenantVendorIndex: index("ops_purchase_orders_tenant_vendor_idx").on(
      table.tenantId,
      table.vendorId,
    ),
  }),
);

export const operationsPurchaseOrderItems = pgTable(
  "ops_purchase_order_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    purchaseOrderId: uuid("purchase_order_id")
      .notNull()
      .references(() => operationsPurchaseOrders.id, { onDelete: "cascade" }),
    productId: uuid("product_id").references(() => operationsProducts.id, {
      onDelete: "set null",
    }),
    productName: varchar("product_name", { length: 255 }).notNull(),
    description: text("description"),
    unitSymbol: varchar("unit_symbol", { length: 30 }).notNull(),
    quantity: integer("quantity").notNull(),
    unitPrice: numeric("unit_price", { precision: 18, scale: 2 })
      .notNull()
      .default("0.00"),
    lineTotal: numeric("line_total", { precision: 18, scale: 2 })
      .notNull()
      .default("0.00"),
    receivedQuantity: integer("received_quantity").notNull().default(0),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    purchaseOrderIndex: index("ops_po_items_order_idx").on(
      table.purchaseOrderId,
    ),
    tenantIndex: index("ops_po_items_tenant_idx").on(table.tenantId),
  }),
);

export type OperationsPurchaseOrder =
  typeof operationsPurchaseOrders.$inferSelect;
export type NewOperationsPurchaseOrder =
  typeof operationsPurchaseOrders.$inferInsert;
export type OperationsPurchaseOrderItem =
  typeof operationsPurchaseOrderItems.$inferSelect;
export type NewOperationsPurchaseOrderItem =
  typeof operationsPurchaseOrderItems.$inferInsert;
export type PurchaseOrderStatus =
  (typeof purchaseOrderStatusEnum.enumValues)[number];
