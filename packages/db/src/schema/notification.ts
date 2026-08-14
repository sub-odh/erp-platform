import { relations } from "drizzle-orm";
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
import { users } from "./user";

export interface NotificationMetadata {
  [key: string]: string | number | boolean | null | undefined;
}

export const notifications = pgTable(
  "platform_notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    recipientUserId: uuid("recipient_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    actorUserId: uuid("actor_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    type: varchar("type", { length: 100 }).notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    message: varchar("message", { length: 1000 }).notNull(),
    actionUrl: varchar("action_url", { length: 1000 }),
    entityType: varchar("entity_type", { length: 100 }),
    entityId: uuid("entity_id"),
    metadata: jsonb("metadata")
      .$type<NotificationMetadata>()
      .notNull()
      .default({}),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("platform_notifications_recipient_created_index").on(
      table.organizationId,
      table.recipientUserId,
      table.createdAt,
    ),
    index("platform_notifications_recipient_read_index").on(
      table.organizationId,
      table.recipientUserId,
      table.readAt,
    ),
  ],
);

export const notificationEmailOutbox = pgTable(
  "platform_notification_email_outbox",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    notificationId: uuid("notification_id")
      .notNull()
      .references(() => notifications.id, { onDelete: "cascade" }),
    recipientEmail: varchar("recipient_email", { length: 320 }).notNull(),
    subject: varchar("subject", { length: 200 }).notNull(),
    body: varchar("body", { length: 5000 }).notNull(),
    status: varchar("status", { length: 20 }).notNull().default("PENDING"),
    attempts: integer("attempts").notNull().default(0),
    nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    lastError: varchar("last_error", { length: 1000 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("platform_notification_outbox_pending_index").on(
      table.organizationId,
      table.status,
      table.nextAttemptAt,
    ),
  ],
);

export const notificationsRelations = relations(notifications, ({ one }) => ({
  organization: one(organizations, {
    fields: [notifications.organizationId],
    references: [organizations.id],
  }),
  recipient: one(users, {
    fields: [notifications.recipientUserId],
    references: [users.id],
    relationName: "notificationRecipient",
  }),
  actor: one(users, {
    fields: [notifications.actorUserId],
    references: [users.id],
    relationName: "notificationActor",
  }),
}));

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type NotificationEmailOutbox =
  typeof notificationEmailOutbox.$inferSelect;
