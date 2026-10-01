import {
  index,
  integer,
  jsonb,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { organizations } from "./organization";

export const companyBackupSchedules = pgTable("company_backup_schedules", {
  organizationId: uuid("organization_id")
    .primaryKey()
    .references(() => organizations.id, { onDelete: "cascade" }),
  frequency: varchar("frequency", { length: 20 }).notNull().default("daily"),
  backupTime: varchar("backup_time", { length: 8 }).notNull().default("02:00:00"),
  backupDay: integer("backup_day").notNull().default(1),
  retentionMaxFiles: integer("retention_max_files").notNull().default(10),
  retentionDays: integer("retention_days").notNull().default(30),
  lastAutomatedRun: timestamp("last_automated_run", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const companyBackupFiles = pgTable(
  "company_backup_files",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    filename: varchar("filename", { length: 255 }).notNull(),
    kind: varchar("kind", { length: 20 }).notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    payload: jsonb("payload").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    organizationCreatedIndex: index(
      "company_backup_files_organization_created_idx",
    ).on(table.organizationId, table.createdAt),
  }),
);

export type CompanyBackupSchedule = typeof companyBackupSchedules.$inferSelect;
export type CompanyBackupFile = typeof companyBackupFiles.$inferSelect;
