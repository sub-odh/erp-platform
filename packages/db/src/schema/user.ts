import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  foreignKey,
  index,
  integer,
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { organizations } from "./organization";

export const userRoleEnum = pgEnum("user_role", [
  "OWNER",
  "SUPER_ADMIN",
  "ADMIN",
  "HR",
  "OPERATIONS",
  "EMPLOYEE",
  "SALES",
  "MANAGEMENT",
  "HEAD",
  "MANAGER",
  "STAFF",
]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, {
        onDelete: "cascade",
      }),

    email: varchar("email", {
      length: 320,
    }).notNull(),

    employeeId: varchar("employee_id", { length: 50 }),

    passwordHash: varchar("password_hash", {
      length: 255,
    }).notNull(),

    firstName: varchar("first_name", {
      length: 100,
    }).notNull(),

    lastName: varchar("last_name", {
      length: 100,
    }).notNull(),

    phone: varchar("phone", {
      length: 50,
    }),

    dateOfBirth: date("date_of_birth"),

    joinedDate: date("joined_date"),

    fatherName: varchar("father_name", {
      length: 200,
    }),

    motherName: varchar("mother_name", {
      length: 200,
    }),

    citizenshipNumber: varchar("citizenship_number", {
      length: 100,
    }),

    panNumber: varchar("pan_number", {
      length: 100,
    }),

    permanentAddress: varchar("permanent_address", {
      length: 500,
    }),

    role: userRoleEnum("role").default("STAFF").notNull(),

    employeeRole: varchar("employee_role", { length: 100 }),

    isActive: boolean("is_active").default(true).notNull(),

    tokenVersion: integer("token_version").default(0).notNull(),

    mustChangePassword: boolean("must_change_password")
      .default(false)
      .notNull(),

    passwordChangedAt: timestamp("password_changed_at", {
      withTimezone: true,
    }),

    lastLoginAt: timestamp("last_login_at", {
      withTimezone: true,
    }),

    avatarUrl: varchar("avatar_url", {
      length: 1000,
    }),

    avatarFileName: varchar("avatar_file_name", {
      length: 255,
    }),

    avatarMimeType: varchar("avatar_mime_type", {
      length: 100,
    }),

    avatarSize: integer("avatar_size"),

    signatureUrl: varchar("signature_url", {
      length: 1000,
    }),

    signatureFileName: varchar("signature_file_name", {
      length: 255,
    }),

    signatureMimeType: varchar("signature_mime_type", {
      length: 100,
    }),

    signatureSize: integer("signature_size"),

    deletedAt: timestamp("deleted_at", {
      withTimezone: true,
    }),

    deletedBy: uuid("deleted_by"),

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
  },
  (table) => [
    uniqueIndex("users_organization_email_unique").on(
      table.organizationId,
      table.email,
    ),

    uniqueIndex("users_organization_employee_id_unique").on(
      table.organizationId,
      table.employeeId,
    ),

    index("users_organization_id_index").on(table.organizationId),

    index("users_email_index").on(table.email),

    index("users_organization_deleted_at_index").on(
      table.organizationId,
      table.deletedAt,
    ),

    foreignKey({
      name: "users_deleted_by_users_id_fk",
      columns: [table.deletedBy],
      foreignColumns: [table.id],
    }).onDelete("set null"),
  ],
);

export const usersRelations = relations(users, ({ one }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),

  deletedByUser: one(users, {
    fields: [users.deletedBy],
    references: [users.id],
    relationName: "userDeletedBy",
  }),
}));

export type User = typeof users.$inferSelect;

export type NewUser = typeof users.$inferInsert;
