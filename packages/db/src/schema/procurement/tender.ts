import {
  date,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { organizations } from "../organization";
import { users } from "../user";

export const procurementTenders = pgTable(
  "procurement_tenders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    submissionDate: date("submission_date").notNull(),
    closingDate: date("closing_date"),
    details: text("details"),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    updatedBy: uuid("updated_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => ({
    tenantSubmissionIndex: index("procurement_tenders_tenant_submission_idx").on(
      table.tenantId,
      table.submissionDate,
    ),
  }),
);

export type ProcurementTender = typeof procurementTenders.$inferSelect;
export type NewProcurementTender = typeof procurementTenders.$inferInsert;
