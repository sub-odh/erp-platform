import {
  boolean,
  index,
  integer,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { organizations } from "../organization";
import { users } from "../user";

export const salesPipelineStages = pgTable(
  "sales_pipeline_stages",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => organizations.id, {
        onDelete: "cascade",
      }),

    name: varchar("name", {
      length: 100,
    }).notNull(),

    position: integer("position").notNull(),

    probability: integer("probability").notNull().default(0),

    isClosed: boolean("is_closed").notNull().default(false),

    isWon: boolean("is_won").notNull().default(false),

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
    tenantNameUnique: uniqueIndex(
      "sales_pipeline_stages_tenant_name_unique",
    ).on(table.tenantId, table.name),

    tenantPositionUnique: uniqueIndex(
      "sales_pipeline_stages_tenant_position_unique",
    ).on(table.tenantId, table.position),

    tenantIndex: index("sales_pipeline_stages_tenant_idx").on(table.tenantId),

    tenantActiveIndex: index("sales_pipeline_stages_tenant_active_idx").on(
      table.tenantId,
      table.isActive,
    ),
  }),
);

export type SalesPipelineStage = typeof salesPipelineStages.$inferSelect;

export type NewSalesPipelineStage = typeof salesPipelineStages.$inferInsert;
