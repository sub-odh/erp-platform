import {
  index,
  pgTable,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { organizations } from "./organization";

export const companyEmployeeRoles = pgTable(
  "company_employee_roles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
  },
  (table) => ({
    organizationIndex: index("company_employee_roles_organization_idx").on(
      table.organizationId,
    ),
    organizationNameUnique: uniqueIndex(
      "company_employee_roles_organization_name_unique",
    ).on(table.organizationId, table.name),
  }),
);

export type CompanyEmployeeRole = typeof companyEmployeeRoles.$inferSelect;
