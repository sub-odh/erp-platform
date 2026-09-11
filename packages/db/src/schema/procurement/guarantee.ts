import {
  date,
  index,
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

/* BG = bank guarantee, PG = performance guarantee. */
export const guaranteeTypeEnum = pgEnum("procurement_guarantee_type", [
  "BG",
  "PG",
]);

export const guaranteeStatusEnum = pgEnum("procurement_guarantee_status", [
  "ACTIVE",
  "RELEASED",
]);

export const procurementGuarantees = pgTable(
  "procurement_guarantees",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    guaranteeType: guaranteeTypeEnum("guarantee_type").notNull(),
    clientName: varchar("client_name", { length: 255 }).notNull(),
    tenderDetails: text("tender_details").notNull(),
    bankNameBranch: varchar("bank_name_branch", { length: 255 }).notNull(),
    amount: numeric("amount", { precision: 18, scale: 2 })
      .notNull()
      .default("0.00"),
    submissionDate: date("submission_date").notNull(),
    expiryDate: date("expiry_date").notNull(),
    assignedPerson: varchar("assigned_person", { length: 155 }),
    documentUrl: varchar("document_url", { length: 500 }),
    status: guaranteeStatusEnum("status").notNull().default("ACTIVE"),
    releaseDate: date("release_date"),
    releaseRemarks: text("release_remarks"),
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
    tenantStatusIndex: index("procurement_guarantees_tenant_status_idx").on(
      table.tenantId,
      table.status,
    ),
    tenantExpiryIndex: index("procurement_guarantees_tenant_expiry_idx").on(
      table.tenantId,
      table.expiryDate,
    ),
  }),
);

export type ProcurementGuarantee = typeof procurementGuarantees.$inferSelect;
export type NewProcurementGuarantee =
  typeof procurementGuarantees.$inferInsert;
export type GuaranteeType = (typeof guaranteeTypeEnum.enumValues)[number];
export type GuaranteeStatus = (typeof guaranteeStatusEnum.enumValues)[number];
