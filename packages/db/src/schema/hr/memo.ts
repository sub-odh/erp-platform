import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { organizations } from "../organization";
import { users } from "../user";
import { hrEmployees } from "./employee";

export const memoStatusEnum = pgEnum("hr_memo_status", [
  "PENDING",
  "VERIFIED",
  "CONFIRMED",
  "APPROVED",
  "REJECTED",
]);

export const hrMemos = pgTable(
  "hr_memos",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    content: text("content").notNull(),
    raisedBy: uuid("raised_by")
      .notNull()
      .references(() => hrEmployees.id, { onDelete: "restrict" }),
    verifierId: uuid("verifier_id").references(() => hrEmployees.id, {
      onDelete: "set null",
    }),
    currentStep: integer("current_step").default(2).notNull(),
    status: memoStatusEnum("status").default("PENDING").notNull(),
    verifierSignedBy: uuid("verifier_signed_by").references(
      () => hrEmployees.id,
      { onDelete: "set null" },
    ),
    hodSignedBy: uuid("hod_signed_by").references(() => hrEmployees.id, {
      onDelete: "set null",
    }),
    ceoSignedBy: uuid("ceo_signed_by").references(() => hrEmployees.id, {
      onDelete: "set null",
    }),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    tenantStatusIndex: index("hr_memos_tenant_status_idx").on(
      table.tenantId,
      table.status,
    ),
  }),
);

export const hrMemoAttachments = pgTable(
  "hr_memo_attachments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    memoId: uuid("memo_id")
      .notNull()
      .references(() => hrMemos.id, { onDelete: "cascade" }),
    fileUrl: varchar("file_url", { length: 1000 }).notNull(),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    mimeType: varchar("mime_type", { length: 100 }),
    fileSize: integer("file_size"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    memoIndex: index("hr_memo_attachments_memo_idx").on(
      table.tenantId,
      table.memoId,
    ),
  }),
);

export type HrMemo = typeof hrMemos.$inferSelect;
export type NewHrMemo = typeof hrMemos.$inferInsert;
export type HrMemoAttachment = typeof hrMemoAttachments.$inferSelect;
export type NewHrMemoAttachment = typeof hrMemoAttachments.$inferInsert;
