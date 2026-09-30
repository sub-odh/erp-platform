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

import { hrEmployees } from "../hr/employee";
import { organizations } from "../organization";
import { salesCustomers } from "../sales/customer";
import { salesLeads } from "../sales/lead";
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
    customerId: uuid("customer_id").references(() => salesCustomers.id, {
      onDelete: "set null",
    }),
    customerName: varchar("customer_name", { length: 255 }).notNull(),
    contactName: varchar("contact_name", { length: 255 }),
    contactPhone: varchar("contact_phone", { length: 80 }),
    deliveryAddress: text("delivery_address"),
    notes: text("notes"),
    status: varchar("status", { length: 32 }).notNull().default("Delivered"),
    isBillable: integer("is_billable").notNull().default(1),
    isVoided: integer("is_voided").notNull().default(0),
    isTaxable: integer("is_taxable").notNull().default(1),
    returnValidityDays: integer("return_validity_days").notNull().default(365),
    sourceBillNo: varchar("source_bill_no", { length: 120 }),
    discountValue: numeric("discount_value", { precision: 18, scale: 2 })
      .notNull()
      .default("0.00"),
    discountType: varchar("discount_type", { length: 16 })
      .notNull()
      .default("percent"),
    subtotalAmount: numeric("subtotal_amount", { precision: 18, scale: 2 })
      .notNull()
      .default("0.00"),
    vatAmount: numeric("vat_amount", { precision: 18, scale: 2 })
      .notNull()
      .default("0.00"),
    grandTotal: numeric("grand_total", { precision: 18, scale: 2 })
      .notNull()
      .default("0.00"),
    soldById: uuid("sold_by_id").references(() => hrEmployees.id, {
      onDelete: "set null",
    }),
    leadId: uuid("lead_id").references(() => salesLeads.id, {
      onDelete: "set null",
    }),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    deliveredBy: uuid("delivered_by").references(() => users.id, {
      onDelete: "set null",
    }),
    balanceVoided: integer("balance_voided").notNull().default(0),
    recoveryNoticeDay: integer("recovery_notice_day"),
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
    assetId: uuid("asset_id").references(() => inventoryAssets.id, {
      onDelete: "restrict",
    }),
    serviceName: varchar("service_name", { length: 255 }),
    itemName: varchar("item_name", { length: 255 }).notNull(),
    serialNumber: varchar("serial_number", { length: 150 }),
    quantity: integer("quantity").notNull(),
    unitPrice: numeric("unit_price", { precision: 18, scale: 2 })
      .notNull()
      .default("0.00"),
    lineTotal: numeric("line_total", { precision: 18, scale: 2 })
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
