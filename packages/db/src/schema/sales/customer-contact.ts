import {
  boolean,
  index,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { organizations } from "../organization";
import { users } from "../user";
import { salesCustomers } from "./customer";
import { sql } from "drizzle-orm";

export const salesCustomerContacts = pgTable(
  "sales_customer_contacts",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => organizations.id, {
        onDelete: "cascade",
      }),

    customerId: uuid("customer_id")
      .notNull()
      .references(() => salesCustomers.id, {
        onDelete: "cascade",
      }),

    firstName: varchar("first_name", {
      length: 100,
    }).notNull(),

    lastName: varchar("last_name", {
      length: 100,
    }).notNull(),

    jobTitle: varchar("job_title", {
      length: 150,
    }),

    email: varchar("email", {
      length: 320,
    }),

    phone: varchar("phone", {
      length: 50,
    }),

    mobile: varchar("mobile", {
      length: 50,
    }),

    isPrimary: boolean("is_primary").notNull().default(false),

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
    customerIndex: index("sales_customer_contacts_customer_idx").on(
      table.customerId,
    ),

    tenantIndex: index("sales_customer_contacts_tenant_idx").on(table.tenantId),

    tenantCustomerIndex: index(
      "sales_customer_contacts_tenant_customer_idx",
    ).on(table.tenantId, table.customerId),

    primaryContactUnique: uniqueIndex("sales_customer_contacts_primary_unique")
      .on(table.tenantId, table.customerId)
      .where(sql`${table.isPrimary} = true`),
  }),
);

export type SalesCustomerContact = typeof salesCustomerContacts.$inferSelect;

export type NewSalesCustomerContact = typeof salesCustomerContacts.$inferInsert;
