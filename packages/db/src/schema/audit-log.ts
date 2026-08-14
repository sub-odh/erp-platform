import { index, jsonb, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

import { organizations } from "./organization";

export interface AuditMetadata {
  routeParams?: Record<string, string>;
  responseStatus?: number;
}

export const auditLogs = pgTable(
  "platform_audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    actorUserId: uuid("actor_user_id").notNull(),
    action: varchar("action", { length: 200 }).notNull(),
    entityType: varchar("entity_type", { length: 100 }).notNull(),
    entityId: uuid("entity_id"),
    requestMethod: varchar("request_method", { length: 10 }).notNull(),
    requestPath: varchar("request_path", { length: 500 }).notNull(),
    requestId: varchar("request_id", { length: 100 }),
    ipAddress: varchar("ip_address", { length: 64 }),
    userAgent: varchar("user_agent", { length: 500 }),
    metadata: jsonb("metadata").$type<AuditMetadata>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("platform_audit_logs_org_created_index").on(
      table.organizationId,
      table.createdAt,
    ),
    index("platform_audit_logs_org_actor_index").on(
      table.organizationId,
      table.actorUserId,
    ),
    index("platform_audit_logs_org_entity_index").on(
      table.organizationId,
      table.entityType,
      table.entityId,
    ),
  ],
);

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
