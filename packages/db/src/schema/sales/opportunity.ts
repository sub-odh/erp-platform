import {
  date,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { organizations } from "../organization";
import { users } from "../user";
import { salesCustomers } from "./customer";
import { salesLeads } from "./lead";
import { salesPipelineStages } from "./pipeline-stage";

export const salesOpportunityStatusEnum = pgEnum("sales_opportunity_status", [
  "OPEN",
  "WON",
  "LOST",
]);

export const salesOpportunities = pgTable(
  "sales_opportunities",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => organizations.id, {
        onDelete: "cascade",
      }),

    name: varchar("name", {
      length: 200,
    }).notNull(),

    customerId: uuid("customer_id").references(() => salesCustomers.id, {
      onDelete: "set null",
    }),

    leadId: uuid("lead_id").references(() => salesLeads.id, {
      onDelete: "set null",
    }),

    stageId: uuid("stage_id")
      .notNull()
      .references(() => salesPipelineStages.id, {
        onDelete: "restrict",
      }),

    ownerUserId: uuid("owner_user_id").references(() => users.id, {
      onDelete: "set null",
    }),

    amount: numeric("amount", {
      precision: 18,
      scale: 2,
    })
      .notNull()
      .default("0.00"),

    probability: integer("probability").notNull().default(0),

    expectedCloseDate: date("expected_close_date"),

    status: salesOpportunityStatusEnum("status").notNull().default("OPEN"),

    lossReason: varchar("loss_reason", {
      length: 500,
    }),

    description: text("description"),

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

    closedAt: timestamp("closed_at", {
      withTimezone: true,
    }),

    deletedAt: timestamp("deleted_at", {
      withTimezone: true,
    }),
  },
  (table) => ({
    tenantIndex: index("sales_opportunities_tenant_idx").on(table.tenantId),

    tenantStageIndex: index("sales_opportunities_tenant_stage_idx").on(
      table.tenantId,
      table.stageId,
    ),

    tenantStatusIndex: index("sales_opportunities_tenant_status_idx").on(
      table.tenantId,
      table.status,
    ),

    tenantOwnerIndex: index("sales_opportunities_tenant_owner_idx").on(
      table.tenantId,
      table.ownerUserId,
    ),

    tenantCustomerIndex: index("sales_opportunities_tenant_customer_idx").on(
      table.tenantId,
      table.customerId,
    ),

    tenantLeadIndex: index("sales_opportunities_tenant_lead_idx").on(
      table.tenantId,
      table.leadId,
    ),

    tenantExpectedCloseIndex: index(
      "sales_opportunities_tenant_expected_close_idx",
    ).on(table.tenantId, table.expectedCloseDate),
  }),
);

export type SalesOpportunity = typeof salesOpportunities.$inferSelect;

export type NewSalesOpportunity = typeof salesOpportunities.$inferInsert;

export type SalesOpportunityStatus =
  (typeof salesOpportunityStatusEnum.enumValues)[number];
