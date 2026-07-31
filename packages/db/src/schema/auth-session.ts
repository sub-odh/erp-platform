import { index, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

import { users } from "./user";

export const authSessions = pgTable(
  "auth_sessions",
  {
    id: uuid("id").primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),

    refreshTokenHash: varchar("refresh_token_hash", {
      length: 64,
    }).notNull(),

    expiresAt: timestamp("expires_at", {
      withTimezone: true,
    }).notNull(),

    revokedAt: timestamp("revoked_at", {
      withTimezone: true,
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
  },
  (table) => [
    index("auth_sessions_user_id_index").on(table.userId),
    index("auth_sessions_expires_at_index").on(table.expiresAt),
  ],
);

export type AuthSession = typeof authSessions.$inferSelect;
