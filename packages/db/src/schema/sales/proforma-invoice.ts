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

export const salesProformaInvoices = pgTable(
  "sales_proforma_invoices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    sequence: integer("sequence").notNull(),
    piNumber: varchar("pi_number", { length: 40 }).notNull(),
    piDate: date("pi_date").notNull(),
    customerDetails: text("customer_details").notNull(),
    billTo: text("bill_to").notNull(),
    shipTo: text("ship_to").notNull(),
    termsConditions: text("terms_conditions"),
    totalAmount: numeric("total_amount", { precision: 18, scale: 2 })
      .notNull()
      .default("0.00"),
    currency: varchar("currency", { length: 3 }).notNull().default("NPR"),
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
    tenantNumberUnique: uniqueIndex(
      "sales_proforma_invoices_tenant_number_unique",
    ).on(table.tenantId, table.piNumber),
    tenantDateIndex: index("sales_proforma_invoices_tenant_date_idx").on(
      table.tenantId,
      table.piDate,
    ),
  }),
);

export const salesProformaItems = pgTable(
  "sales_proforma_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    proformaInvoiceId: uuid("proforma_invoice_id")
      .notNull()
      .references(() => salesProformaInvoices.id, { onDelete: "cascade" }),
    itemName: varchar("item_name", { length: 255 }).notNull().default(""),
    partNumber: varchar("part_number", { length: 255 }).notNull().default(""),
    description: text("description").notNull().default(""),
    quantity: integer("quantity").notNull(),
    unitPrice: numeric("unit_price", { precision: 18, scale: 2 })
      .notNull()
      .default("0.00"),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => ({
    invoiceIndex: index("sales_proforma_items_invoice_idx").on(
      table.proformaInvoiceId,
    ),
    tenantIndex: index("sales_proforma_items_tenant_idx").on(table.tenantId),
  }),
);

export type SalesProformaInvoice = typeof salesProformaInvoices.$inferSelect;
export type NewSalesProformaInvoice = typeof salesProformaInvoices.$inferInsert;
export type SalesProformaItem = typeof salesProformaItems.$inferSelect;
export type NewSalesProformaItem = typeof salesProformaItems.$inferInsert;
