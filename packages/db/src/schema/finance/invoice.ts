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

import { organizations } from "../organization";
import { users } from "../user";
import { operationsDeliveryOrders } from "../operations/delivery-order";

export const financeInvoiceStatusEnum = pgEnum("finance_invoice_status", [
  "UNPAID",
  "PARTIAL",
  "PAID",
  "VOID",
]);

export const financePaymentMethodEnum = pgEnum("finance_payment_method", [
  "CASH",
  "BANK",
  "CHEQUE",
  "ONLINE",
  "OTHER",
]);

export const financeInvoices = pgTable(
  "finance_invoices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    invoiceNumber: varchar("invoice_number", { length: 40 }).notNull(),
    deliveryOrderId: uuid("delivery_order_id")
      .notNull()
      .references(() => operationsDeliveryOrders.id, { onDelete: "restrict" }),
    customerName: varchar("customer_name", { length: 255 }).notNull(),
    invoiceDate: date("invoice_date").notNull(),
    subtotalAmount: numeric("subtotal_amount", { precision: 18, scale: 2 })
      .notNull()
      .default("0.00"),
    vatAmount: numeric("vat_amount", { precision: 18, scale: 2 })
      .notNull()
      .default("0.00"),
    totalAmount: numeric("total_amount", { precision: 18, scale: 2 })
      .notNull()
      .default("0.00"),
    paidAmount: numeric("paid_amount", { precision: 18, scale: 2 })
      .notNull()
      .default("0.00"),
    status: financeInvoiceStatusEnum("status").notNull().default("UNPAID"),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantNumberUnique: uniqueIndex("finance_invoices_tenant_number_unique").on(
      table.tenantId,
      table.invoiceNumber,
    ),
    deliveryOrderUnique: uniqueIndex("finance_invoices_delivery_order_unique").on(
      table.deliveryOrderId,
    ),
    tenantStatusIndex: index("finance_invoices_tenant_status_idx").on(
      table.tenantId,
      table.status,
    ),
  }),
);

export const financeInvoiceItems = pgTable(
  "finance_invoice_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    invoiceId: uuid("invoice_id")
      .notNull()
      .references(() => financeInvoices.id, { onDelete: "cascade" }),
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
    invoiceIndex: index("finance_invoice_items_invoice_idx").on(table.invoiceId),
    tenantIndex: index("finance_invoice_items_tenant_idx").on(table.tenantId),
  }),
);

export const financePayments = pgTable(
  "finance_payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    invoiceId: uuid("invoice_id")
      .notNull()
      .references(() => financeInvoices.id, { onDelete: "cascade" }),
    amount: numeric("amount", { precision: 18, scale: 2 }).notNull(),
    method: financePaymentMethodEnum("method").notNull(),
    referenceNumber: varchar("reference_number", { length: 120 }),
    remarks: text("remarks"),
    paidAt: timestamp("paid_at", { withTimezone: true }).notNull().defaultNow(),
    recordedBy: uuid("recorded_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    invoiceIndex: index("finance_payments_invoice_idx").on(table.invoiceId),
    tenantIndex: index("finance_payments_tenant_idx").on(table.tenantId),
  }),
);

export type FinanceInvoice = typeof financeInvoices.$inferSelect;
export type NewFinanceInvoice = typeof financeInvoices.$inferInsert;
export type FinanceInvoiceItem = typeof financeInvoiceItems.$inferSelect;
export type NewFinanceInvoiceItem = typeof financeInvoiceItems.$inferInsert;
export type FinancePayment = typeof financePayments.$inferSelect;
export type NewFinancePayment = typeof financePayments.$inferInsert;
export type FinanceInvoiceStatus =
  (typeof financeInvoiceStatusEnum.enumValues)[number];
export type FinancePaymentMethod =
  (typeof financePaymentMethodEnum.enumValues)[number];
