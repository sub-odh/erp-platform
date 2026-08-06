import { relations } from "drizzle-orm";
import {
  boolean,
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
  "ADMIN",
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

    passwordHash: varchar("password_hash", {
      length: 255,
    }).notNull(),

    firstName: varchar("first_name", {
      length: 100,
    }).notNull(),

    lastName: varchar("last_name", {
      length: 100,
    }).notNull(),

    role: userRoleEnum("role").default("STAFF").notNull(),

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
