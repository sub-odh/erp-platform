CREATE TYPE "hr_employee_gender" AS ENUM ('MALE', 'FEMALE', 'OTHERS');--> statement-breakpoint
CREATE TYPE "hr_employee_marital_status" AS ENUM ('SINGLE', 'MARRIED');--> statement-breakpoint
CREATE TYPE "hr_employee_status" AS ENUM ('ACTIVE', 'INACTIVE');--> statement-breakpoint
CREATE TABLE "hr_employees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid,
	"employee_code" varchar(50) NOT NULL,
	"attendance_device_id" integer,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"father_name" varchar(255),
	"mother_name" varchar(255),
	"date_of_birth" date,
	"gender" "hr_employee_gender",
	"marital_status" "hr_employee_marital_status" DEFAULT 'SINGLE',
	"spouse_name" varchar(255),
	"work_email" varchar(320),
	"phone" varchar(50),
	"alt_phone" varchar(50),
	"emergency_contact_name" varchar(255),
	"emergency_contact_phone" varchar(50),
	"emergency_contact_relation" varchar(100),
	"citizenship_number" varchar(100),
	"pan_number" varchar(100),
	"permanent_address" text,
	"current_address" text,
	"bank_name" varchar(255),
	"bank_branch" varchar(255),
	"bank_account_name" varchar(255),
	"bank_account_number" varchar(100),
	"join_date" date,
	"resignation_date" date,
	"designation" varchar(100),
	"department" varchar(100),
	"qualification" text,
	"past_experience" text,
	"salary" numeric(15, 2),
	"manager_id" uuid,
	"last_increment_month" varchar(7),
	"has_sales_target" boolean DEFAULT false NOT NULL,
	"sales_target" numeric(15, 2),
	"yearly_sales_target" numeric(15, 2),
	"target_start_date" date,
	"target_end_date" date,
	"status" "hr_employee_status" DEFAULT 'ACTIVE' NOT NULL,
	"photo_url" varchar(1000),
	"photo_file_name" varchar(255),
	"photo_mime_type" varchar(100),
	"photo_size" integer,
	"signature_url" varchar(1000),
	"signature_file_name" varchar(255),
	"signature_mime_type" varchar(100),
	"signature_size" integer,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "hr_employees" ADD CONSTRAINT "hr_employees_tenant_id_organizations_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE cascade;--> statement-breakpoint
ALTER TABLE "hr_employees" ADD CONSTRAINT "hr_employees_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE set null;--> statement-breakpoint
ALTER TABLE "hr_employees" ADD CONSTRAINT "hr_employees_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE set null;--> statement-breakpoint
ALTER TABLE "hr_employees" ADD CONSTRAINT "hr_employees_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE set null;--> statement-breakpoint
ALTER TABLE "hr_employees" ADD CONSTRAINT "hr_employees_manager_id_fk" FOREIGN KEY ("manager_id") REFERENCES "hr_employees"("id") ON DELETE set null;--> statement-breakpoint
CREATE UNIQUE INDEX "hr_employees_tenant_code_unique" ON "hr_employees" ("tenant_id","employee_code");--> statement-breakpoint
CREATE UNIQUE INDEX "hr_employees_tenant_user_unique" ON "hr_employees" ("tenant_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "hr_employees_tenant_device_unique" ON "hr_employees" ("tenant_id","attendance_device_id");--> statement-breakpoint
CREATE INDEX "hr_employees_tenant_status_idx" ON "hr_employees" ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "hr_employees_tenant_department_idx" ON "hr_employees" ("tenant_id","department");--> statement-breakpoint
ALTER TABLE "hr_employees" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "hr_employees" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "hr_employees_tenant_isolation" ON "hr_employees" USING ("tenant_id" = "app"."current_tenant_id"()) WITH CHECK ("tenant_id" = "app"."current_tenant_id"());
--> statement-breakpoint
INSERT INTO "platform_permissions" ("code", "description") VALUES
  ('hr.employees.manage', 'Create and manage company employee records')
ON CONFLICT ("code") DO NOTHING;
--> statement-breakpoint
ALTER TABLE "platform_role_permissions" NO FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
INSERT INTO "platform_role_permissions" ("organization_id", "role", "permission_id")
SELECT organizations.id, assignments.role, permissions.id
FROM "organizations" AS organizations
CROSS JOIN (VALUES
  ('OWNER'::"user_role", 'hr.employees.manage'),
  ('SUPER_ADMIN'::"user_role", 'hr.employees.manage'),
  ('ADMIN'::"user_role", 'hr.employees.manage'),
  ('HR'::"user_role", 'hr.employees.manage')
) AS assignments(role, permission_code)
INNER JOIN "platform_permissions" AS permissions ON permissions.code = assignments.permission_code
ON CONFLICT DO NOTHING;
--> statement-breakpoint
ALTER TABLE "platform_role_permissions" FORCE ROW LEVEL SECURITY;
