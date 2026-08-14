ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
--> statement-breakpoint
CREATE TYPE "user_role_v2" AS ENUM ('OWNER', 'SUPER_ADMIN', 'ADMIN', 'HR', 'OPERATIONS', 'EMPLOYEE', 'SALES', 'MANAGEMENT', 'HEAD', 'MANAGER', 'STAFF');
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" TYPE "user_role_v2" USING "role"::text::"user_role_v2";
--> statement-breakpoint
ALTER TABLE "platform_role_permissions" ALTER COLUMN "role" TYPE "user_role_v2" USING "role"::text::"user_role_v2";
--> statement-breakpoint
DROP TYPE "user_role";
--> statement-breakpoint
ALTER TYPE "user_role_v2" RENAME TO "user_role";
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'STAFF'::"user_role";
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "employee_id" varchar(50);
--> statement-breakpoint
CREATE UNIQUE INDEX "users_organization_employee_id_unique" ON "users" ("organization_id", "employee_id");
--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "registration_date" date;
--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "office_start_time" varchar(5);
--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "office_end_time" varchar(5);
--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "invoice_logo_url" varchar(1000);
--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "invoice_logo_file_name" varchar(255);
--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "invoice_logo_mime_type" varchar(100);
--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "invoice_logo_size" integer;
--> statement-breakpoint
CREATE TABLE "platform_smtp_configurations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "host" varchar(255) NOT NULL,
  "port" integer NOT NULL,
  "username" varchar(320) NOT NULL,
  "encrypted_password" varchar(2000) NOT NULL,
  "encryption" varchar(20) NOT NULL,
  "from_email" varchar(320) NOT NULL,
  "sender_name" varchar(200) NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "last_tested_at" timestamp with time zone,
  "last_test_succeeded" boolean,
  "last_error" varchar(1000),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "platform_smtp_configurations" ADD CONSTRAINT "platform_smtp_configurations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade;
--> statement-breakpoint
CREATE UNIQUE INDEX "platform_smtp_configurations_org_unique" ON "platform_smtp_configurations" ("organization_id");
--> statement-breakpoint
CREATE INDEX "platform_smtp_configurations_active_index" ON "platform_smtp_configurations" ("organization_id", "is_active");
--> statement-breakpoint
ALTER TABLE "platform_smtp_configurations" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "platform_smtp_configurations" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "platform_smtp_configurations_tenant_all" ON "platform_smtp_configurations" USING ("organization_id" = "app"."current_tenant_id"()) WITH CHECK ("organization_id" = "app"."current_tenant_id"());
--> statement-breakpoint
INSERT INTO "platform_permissions" ("code", "description") VALUES ('platform.smtp.manage', 'Configure company SMTP delivery');
--> statement-breakpoint
ALTER TABLE "platform_role_permissions" NO FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
INSERT INTO "platform_role_permissions" ("organization_id", "role", "permission_id")
SELECT organizations.id, assignments.role, permissions.id
FROM "organizations" AS organizations
CROSS JOIN (VALUES
  ('SUPER_ADMIN'::"user_role", 'platform.users.manage'),
  ('SUPER_ADMIN'::"user_role", 'platform.organization.manage'),
  ('SUPER_ADMIN'::"user_role", 'platform.audit.read'),
  ('SUPER_ADMIN'::"user_role", 'platform.notifications.manage'),
  ('SUPER_ADMIN'::"user_role", 'platform.smtp.manage'),
  ('SUPER_ADMIN'::"user_role", 'sales.crm.access'),
  ('SUPER_ADMIN'::"user_role", 'sales.crm.permanent-delete'),
  ('HR'::"user_role", 'platform.users.manage'),
  ('OWNER'::"user_role", 'platform.smtp.manage'),
  ('ADMIN'::"user_role", 'platform.smtp.manage'),
  ('SALES'::"user_role", 'sales.crm.access'),
  ('MANAGEMENT'::"user_role", 'sales.crm.access'),
  ('MANAGEMENT'::"user_role", 'platform.audit.read'),
  ('HEAD'::"user_role", 'sales.crm.access')
) AS assignments(role, permission_code)
INNER JOIN "platform_permissions" AS permissions ON permissions.code = assignments.permission_code
ON CONFLICT DO NOTHING;
--> statement-breakpoint
ALTER TABLE "platform_role_permissions" FORCE ROW LEVEL SECURITY;
