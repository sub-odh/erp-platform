ALTER TABLE "sales_customers"
  ADD COLUMN "contact_person" varchar(200),
  ADD COLUMN "address" text,
  ADD COLUMN "logo_url" varchar(1000),
  ADD COLUMN "logo_file_name" varchar(255),
  ADD COLUMN "logo_mime_type" varchar(100),
  ADD COLUMN "logo_size" integer;
--> statement-breakpoint
CREATE UNIQUE INDEX "sales_customers_tenant_name_unique"
  ON "sales_customers" ("tenant_id", lower("name"))
  WHERE "deleted_at" IS NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX "sales_customers_tenant_tax_unique"
  ON "sales_customers" ("tenant_id", lower("tax_number"))
  WHERE "deleted_at" IS NULL AND "tax_number" IS NOT NULL;
--> statement-breakpoint
ALTER TABLE "platform_role_permissions" NO FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
INSERT INTO "platform_role_permissions" ("organization_id", "role", "permission_id")
SELECT organizations.id, assignments.role, permissions.id
FROM "organizations" AS organizations
CROSS JOIN (VALUES
  ('HR'::"user_role", 'sales.crm.access'),
  ('OPERATIONS'::"user_role", 'sales.crm.access')
) AS assignments(role, permission_code)
INNER JOIN "platform_permissions" AS permissions ON permissions.code = assignments.permission_code
ON CONFLICT DO NOTHING;
--> statement-breakpoint
ALTER TABLE "platform_role_permissions" FORCE ROW LEVEL SECURITY;
