import {
  date,
  index,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { organizations } from "../organization";
import { users } from "../user";

export const officeAssets = pgTable(
  "ops_office_assets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    assetName: varchar("asset_name", { length: 255 }).notNull(),
    category: varchar("category", { length: 150 }),
    purchaseSource: varchar("purchase_source", { length: 255 }),
    purchasePrice: numeric("purchase_price", { precision: 18, scale: 2 })
      .notNull()
      .default("0.00"),
    purchaseDate: date("purchase_date"),
    itemDetails: text("item_details"),
    currentLocation: varchar("current_location", { length: 255 }),
    utilizationStatus: varchar("utilization_status", { length: 32 })
      .notNull()
      .default("Available"),
    techPersonName: varchar("tech_person_name", { length: 255 }),
    techPersonContact: varchar("tech_person_contact", { length: 255 }),
    techPersonEmail: varchar("tech_person_email", { length: 255 }),
    techUsageDetails: text("tech_usage_details"),
    techUsedDate: date("tech_used_date"),
    pocPersonContact: varchar("poc_person_contact", { length: 255 }),
    pocPersonEmail: varchar("poc_person_email", { length: 255 }),
    pocCompanyName: varchar("poc_company_name", { length: 255 }),
    pocClientName: varchar("poc_client_name", { length: 255 }),
    pocStartDate: date("poc_start_date"),
    pocTakenTime: varchar("poc_taken_time", { length: 8 }),
    returnDeadline: date("return_deadline"),
    returnTime: varchar("return_time", { length: 8 }),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    updatedBy: uuid("updated_by").references(() => users.id, {
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
    tenantCreatedIndex: index("ops_office_assets_tenant_created_idx").on(
      table.tenantId,
      table.createdAt,
    ),
  }),
);

export type OfficeAsset = typeof officeAssets.$inferSelect;
export type NewOfficeAsset = typeof officeAssets.$inferInsert;
