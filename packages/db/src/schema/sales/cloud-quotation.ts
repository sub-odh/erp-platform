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

export const salesCloudQuotations = pgTable(
  "sales_cloud_quotations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    quotationNumber: varchar("quotation_number", { length: 40 }).notNull(),
    customerName: varchar("customer_name", { length: 255 }).notNull(),
    customerAddress: text("customer_address"),
    issueDate: date("issue_date").notNull(),
    expiryDate: date("expiry_date"),
    currency: varchar("currency", { length: 3 }).notNull().default("NPR"),
    vatApplicable: integer("vat_applicable").notNull().default(1),
    subtotalAmount: numeric("subtotal_amount", { precision: 18, scale: 2 })
      .notNull()
      .default("0.00"),
    discountAmount: numeric("discount_amount", { precision: 18, scale: 2 })
      .notNull()
      .default("0.00"),
    vatAmount: numeric("vat_amount", { precision: 18, scale: 2 })
      .notNull()
      .default("0.00"),
    totalAmount: numeric("total_amount", { precision: 18, scale: 2 })
      .notNull()
      .default("0.00"),
    terms: text("terms"),
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
    tenantNumberUnique: uniqueIndex("sales_cloud_quotations_tenant_number_unique").on(
      table.tenantId,
      table.quotationNumber,
    ),
    tenantIssueDateIndex: index("sales_cloud_quotations_tenant_issue_date_idx").on(
      table.tenantId,
      table.issueDate,
    ),
  }),
);

export const salesCloudQuotationItems = pgTable(
  "sales_cloud_quotation_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    quotationId: uuid("quotation_id")
      .notNull()
      .references(() => salesCloudQuotations.id, { onDelete: "cascade" }),
    serviceType: varchar("service_type", { length: 80 }).notNull(),
    itemName: varchar("item_name", { length: 255 }).notNull(),
    description: text("description"),
    quantity: integer("quantity").notNull(),
    unitPrice: numeric("unit_price", { precision: 18, scale: 2 })
      .notNull()
      .default("0.00"),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => ({
    quotationIndex: index("sales_cloud_quotation_items_quotation_idx").on(
      table.quotationId,
    ),
    tenantIndex: index("sales_cloud_quotation_items_tenant_idx").on(table.tenantId),
  }),
);

export type SalesCloudQuotation = typeof salesCloudQuotations.$inferSelect;
export type NewSalesCloudQuotation = typeof salesCloudQuotations.$inferInsert;
export type NewSalesCloudQuotationItem = typeof salesCloudQuotationItems.$inferInsert;
