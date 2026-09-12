CREATE TABLE "hr_holidays" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"holiday_date" date NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "hr_holidays" ADD CONSTRAINT "hr_holidays_tenant_id_organizations_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE cascade;--> statement-breakpoint
ALTER TABLE "hr_holidays" ADD CONSTRAINT "hr_holidays_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE set null;--> statement-breakpoint
ALTER TABLE "hr_holidays" ADD CONSTRAINT "hr_holidays_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE set null;--> statement-breakpoint
CREATE UNIQUE INDEX "hr_holidays_tenant_date_unique" ON "hr_holidays" ("tenant_id","holiday_date");--> statement-breakpoint
CREATE INDEX "hr_holidays_tenant_date_idx" ON "hr_holidays" ("tenant_id","holiday_date");--> statement-breakpoint
ALTER TABLE "hr_holidays" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "hr_holidays" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "hr_holidays_tenant_isolation" ON "hr_holidays" USING ("tenant_id" = "app"."current_tenant_id"()) WITH CHECK ("tenant_id" = "app"."current_tenant_id"());
--> statement-breakpoint
INSERT INTO "platform_permissions" ("code", "description") VALUES
  ('hr.holidays.manage', 'Create and manage company holidays')
ON CONFLICT ("code") DO NOTHING;
--> statement-breakpoint
ALTER TABLE "platform_role_permissions" NO FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
INSERT INTO "platform_role_permissions" ("organization_id", "role", "permission_id")
SELECT organizations.id, assignments.role, permissions.id
FROM "organizations" AS organizations
CROSS JOIN (VALUES
  ('OWNER'::"user_role", 'hr.holidays.manage'),
  ('SUPER_ADMIN'::"user_role", 'hr.holidays.manage'),
  ('ADMIN'::"user_role", 'hr.holidays.manage'),
  ('HR'::"user_role", 'hr.holidays.manage')
) AS assignments(role, permission_code)
INNER JOIN "platform_permissions" AS permissions ON permissions.code = assignments.permission_code
ON CONFLICT DO NOTHING;
--> statement-breakpoint
ALTER TABLE "platform_role_permissions" FORCE ROW LEVEL SECURITY;
