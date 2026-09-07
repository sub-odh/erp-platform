import { sql } from "drizzle-orm";
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
import { salesCustomers } from "./customer";

export const quotationStatusEnum = pgEnum("sales_quotation_status", [
  "ACTIVE",
  "ACCEPTED",
  "REJECTED",
  "EXPIRED",
  "CANCELLED",
]);

export const salesQuotations = pgTable(
  "sales_quotations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    quotationNumber: varchar("quotation_number", { length: 40 }).notNull(),
    customerId: uuid("customer_id").notNull().references(() => salesCustomers.id, { onDelete: "restrict" }),
    issueDate: date("issue_date").notNull(),
    expiryDate: date("expiry_date").notNull(),
    destinationAddress: text("destination_address"),
    terms: text("terms"),
    status: quotationStatusEnum("status").notNull().default("ACTIVE"),
    subtotalAmount: numeric("subtotal_amount", { precision: 18, scale: 2 }).notNull().default("0.00"),
    vatAmount: numeric("vat_amount", { precision: 18, scale: 2 }).notNull().default("0.00"),
    totalAmount: numeric("total_amount", { precision: 18, scale: 2 }).notNull().default("0.00"),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    updatedBy: uuid("updated_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => ({
    tenantNumberUnique: uniqueIndex("sales_quotations_tenant_number_unique").on(table.tenantId, table.quotationNumber).where(sql`${table.deletedAt} is null`),
    tenantIssueDateIndex: index("sales_quotations_tenant_issue_date_idx").on(table.tenantId, table.issueDate),
    tenantCustomerIndex: index("sales_quotations_tenant_customer_idx").on(table.tenantId, table.customerId),
  }),
);

export const salesQuotationItems = pgTable(
  "sales_quotation_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    quotationId: uuid("quotation_id").notNull().references(() => salesQuotations.id, { onDelete: "cascade" }),
    itemName: varchar("item_name", { length: 255 }).notNull(),
    description: text("description"),
    quantity: integer("quantity").notNull(),
    unitPrice: numeric("unit_price", { precision: 18, scale: 2 }).notNull().default("0.00"),
    lineTotal: numeric("line_total", { precision: 18, scale: 2 }).notNull().default("0.00"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    quotationIndex: index("sales_quotation_items_quotation_idx").on(table.quotationId),
    tenantIndex: index("sales_quotation_items_tenant_idx").on(table.tenantId),
  }),
);

export type SalesQuotation = typeof salesQuotations.$inferSelect;
export type NewSalesQuotation = typeof salesQuotations.$inferInsert;
export type SalesQuotationItem = typeof salesQuotationItems.$inferSelect;
export type NewSalesQuotationItem = typeof salesQuotationItems.$inferInsert;
export type QuotationStatus = (typeof quotationStatusEnum.enumValues)[number];
