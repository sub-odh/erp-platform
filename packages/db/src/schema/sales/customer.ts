import {
  boolean,
  index,
  numeric,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
  text,
} from "drizzle-orm/pg-core";

import { organizations } from "../organization";
import { users } from "../user";

export const salesCustomers = pgTable(
  "sales_customers",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => organizations.id, {
        onDelete: "cascade",
      }),

    customerCode: varchar("customer_code", {
      length: 50,
    }).notNull(),

    name: varchar("name", {
      length: 200,
    }).notNull(),

    legalName: varchar("legal_name", {
      length: 200,
    }),

    taxNumber: varchar("tax_number", {
      length: 100,
    }),

    email: varchar("email", {
      length: 320,
    }),

    phone: varchar("phone", {
      length: 50,
    }),

    website: varchar("website", {
      length: 500,
    }),

    billingAddressLine1: varchar("billing_address_line_1", {
      length: 255,
    }),

    billingAddressLine2: varchar("billing_address_line_2", {
      length: 255,
    }),

    billingCity: varchar("billing_city", {
      length: 100,
    }),

    billingState: varchar("billing_state", {
      length: 100,
    }),

    billingPostalCode: varchar("billing_postal_code", {
      length: 30,
    }),

    billingCountry: varchar("billing_country", {
      length: 100,
    }),

    shippingAddressLine1: varchar("shipping_address_line_1", {
      length: 255,
    }),

    shippingAddressLine2: varchar("shipping_address_line_2", {
      length: 255,
    }),

    shippingCity: varchar("shipping_city", {
      length: 100,
    }),

    shippingState: varchar("shipping_state", {
      length: 100,
    }),

    shippingPostalCode: varchar("shipping_postal_code", {
      length: 30,
    }),

    shippingCountry: varchar("shipping_country", {
      length: 100,
    }),

    creditLimit: numeric("credit_limit", {
      precision: 18,
      scale: 2,
    })
      .notNull()
      .default("0.00"),

    paymentTermsDays: numeric("payment_terms_days", {
      precision: 5,
      scale: 0,
    })
      .notNull()
      .default("0"),

    notes: text("notes"),

    isActive: boolean("is_active").notNull().default(true),

    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),

    updatedBy: uuid("updated_by").references(() => users.id, {
      onDelete: "set null",
    }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    deletedAt: timestamp("deleted_at", {
      withTimezone: true,
    }),
  },
  (table) => ({
    customerCodeUnique: uniqueIndex("sales_customers_tenant_code_unique").on(
      table.tenantId,
      table.customerCode,
    ),

    tenantIndex: index("sales_customers_tenant_idx").on(table.tenantId),

    tenantStatusIndex: index("sales_customers_tenant_active_idx").on(
      table.tenantId,
      table.isActive,
    ),

    tenantNameIndex: index("sales_customers_tenant_name_idx").on(
      table.tenantId,
      table.name,
    ),
  }),
);

export type SalesCustomer = typeof salesCustomers.$inferSelect;

export type NewSalesCustomer = typeof salesCustomers.$inferInsert;
