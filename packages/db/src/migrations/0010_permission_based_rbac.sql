CREATE TABLE "platform_permissions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "code" varchar(100) NOT NULL,
  "description" varchar(255) NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "platform_permissions_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "platform_role_permissions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "role" "user_role" NOT NULL,
  "permission_id" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "platform_role_permissions" ADD CONSTRAINT "platform_role_permissions_organization_id_organizations_id_fk"
  FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "platform_role_permissions" ADD CONSTRAINT "platform_role_permissions_permission_id_platform_permissions_id_fk"
  FOREIGN KEY ("permission_id") REFERENCES "public"."platform_permissions"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "platform_role_permissions_org_role_permission_unique"
  ON "platform_role_permissions" USING btree ("organization_id", "role", "permission_id");
--> statement-breakpoint
CREATE INDEX "platform_role_permissions_org_role_index"
  ON "platform_role_permissions" USING btree ("organization_id", "role");
--> statement-breakpoint
INSERT INTO "platform_permissions" ("code", "description") VALUES
  ('platform.users.manage', 'Create and manage organization users'),
  ('platform.organization.manage', 'Update organization settings and branding'),
  ('sales.crm.access', 'Access and manage Sales/CRM records'),
  ('sales.crm.permanent-delete', 'Permanently delete archived Sales/CRM records');
--> statement-breakpoint
INSERT INTO "platform_role_permissions" ("organization_id", "role", "permission_id")
SELECT organizations.id, roles.role, permissions.id
FROM "organizations" AS organizations
CROSS JOIN (VALUES
  ('OWNER'::"user_role", 'platform.users.manage'),
  ('OWNER'::"user_role", 'platform.organization.manage'),
  ('OWNER'::"user_role", 'sales.crm.access'),
  ('OWNER'::"user_role", 'sales.crm.permanent-delete'),
  ('ADMIN'::"user_role", 'platform.users.manage'),
  ('ADMIN'::"user_role", 'platform.organization.manage'),
  ('ADMIN'::"user_role", 'sales.crm.access'),
  ('ADMIN'::"user_role", 'sales.crm.permanent-delete'),
  ('MANAGER'::"user_role", 'sales.crm.access'),
  ('STAFF'::"user_role", 'sales.crm.access')
) AS roles(role, permission_code)
INNER JOIN "platform_permissions" AS permissions
  ON permissions.code = roles.permission_code;
--> statement-breakpoint
ALTER TABLE "platform_role_permissions" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "platform_role_permissions" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "platform_role_permissions_tenant_isolation" ON "platform_role_permissions"
  USING ("organization_id" = "app"."current_tenant_id"())
  WITH CHECK ("organization_id" = "app"."current_tenant_id"());
