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
import { operationsProducts } from "./product";
import {
  operationsPurchaseOrderItems,
  operationsPurchaseOrders,
} from "./purchase-order";

export const operationsGoodsReceipts = pgTable(
  "ops_goods_receipts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    receiptNumber: varchar("receipt_number", { length: 40 }).notNull(),
    purchaseOrderId: uuid("purchase_order_id")
      .notNull()
      .references(() => operationsPurchaseOrders.id, { onDelete: "restrict" }),
    receivedDate: date("received_date").notNull(),
    deliveryNote: varchar("delivery_note", { length: 120 }),
    notes: text("notes"),
    receivedBy: uuid("received_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantReceiptNumberUnique: uniqueIndex(
      "ops_goods_receipts_tenant_number_unique",
    ).on(table.tenantId, table.receiptNumber),
    tenantPurchaseOrderIndex: index("ops_goods_receipts_tenant_po_idx").on(
      table.tenantId,
      table.purchaseOrderId,
    ),
    tenantDateIndex: index("ops_goods_receipts_tenant_date_idx").on(
      table.tenantId,
      table.receivedDate,
    ),
  }),
);

export const operationsGoodsReceiptItems = pgTable(
  "ops_goods_receipt_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    goodsReceiptId: uuid("goods_receipt_id")
      .notNull()
      .references(() => operationsGoodsReceipts.id, { onDelete: "cascade" }),
    purchaseOrderItemId: uuid("purchase_order_item_id")
      .notNull()
      .references(() => operationsPurchaseOrderItems.id, {
        onDelete: "restrict",
      }),
    productId: uuid("product_id").references(() => operationsProducts.id, {
      onDelete: "set null",
    }),
    productName: varchar("product_name", { length: 255 }).notNull(),
    quantity: integer("quantity").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    receiptItemUnique: uniqueIndex(
      "ops_goods_receipt_items_receipt_po_item_unique",
    ).on(table.goodsReceiptId, table.purchaseOrderItemId),
    tenantReceiptIndex: index("ops_goods_receipt_items_tenant_receipt_idx").on(
      table.tenantId,
      table.goodsReceiptId,
    ),
  }),
);

export type OperationsGoodsReceipt =
  typeof operationsGoodsReceipts.$inferSelect;
export type NewOperationsGoodsReceipt =
  typeof operationsGoodsReceipts.$inferInsert;
export type OperationsGoodsReceiptItem =
  typeof operationsGoodsReceiptItems.$inferSelect;
export type NewOperationsGoodsReceiptItem =
  typeof operationsGoodsReceiptItems.$inferInsert;
