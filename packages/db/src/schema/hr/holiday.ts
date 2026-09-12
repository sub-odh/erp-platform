import {
  date,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { organizations } from "../organization";
import { users } from "../user";

export const hrHolidays = pgTable(
  "hr_holidays",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    holidayDate: date("holiday_date").notNull(),
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
    tenantDateUnique: uniqueIndex("hr_holidays_tenant_date_unique").on(
      table.tenantId,
      table.holidayDate,
    ),
    tenantDateIndex: index("hr_holidays_tenant_date_idx").on(
      table.tenantId,
      table.holidayDate,
    ),
  }),
);

export type HrHoliday = typeof hrHolidays.$inferSelect;
export type NewHrHoliday = typeof hrHolidays.$inferInsert;
