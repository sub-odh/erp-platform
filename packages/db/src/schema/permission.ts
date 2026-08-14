import { relations } from "drizzle-orm";
import {
  index,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { organizations } from "./organization";
import { userRoleEnum } from "./user";

export const permissions = pgTable("platform_permissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: varchar("code", { length: 100 }).notNull().unique(),
  description: varchar("description", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const rolePermissions = pgTable(
  "platform_role_permissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    role: userRoleEnum("role").notNull(),
    permissionId: uuid("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("platform_role_permissions_org_role_permission_unique").on(
      table.organizationId,
      table.role,
      table.permissionId,
    ),
    index("platform_role_permissions_org_role_index").on(
      table.organizationId,
      table.role,
    ),
  ],
);

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));

export const rolePermissionsRelations = relations(
  rolePermissions,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [rolePermissions.organizationId],
      references: [organizations.id],
    }),
    permission: one(permissions, {
      fields: [rolePermissions.permissionId],
      references: [permissions.id],
    }),
  }),
);

export type Permission = typeof permissions.$inferSelect;
export type RolePermission = typeof rolePermissions.$inferSelect;
