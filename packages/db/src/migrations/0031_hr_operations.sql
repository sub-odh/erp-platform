ALTER TABLE "hr_employees"
  ADD COLUMN "annual_leave_bal" numeric(5, 2) DEFAULT '21.00' NOT NULL,
  ADD COLUMN "sick_leave_bal" numeric(5, 2) DEFAULT '15.00' NOT NULL,
  ADD COLUMN "casual_leave_bal" numeric(5, 2) DEFAULT '12.00' NOT NULL,
  ADD COLUMN "annual_leave_enabled" boolean DEFAULT true NOT NULL;
--> statement-breakpoint
CREATE TYPE "hr_leave_type_code" AS ENUM ('ANNUAL', 'SICK', 'CASUAL');
--> statement-breakpoint
CREATE TYPE "hr_leave_request_status" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
--> statement-breakpoint
CREATE TYPE "hr_expense_type" AS ENUM ('TADA', 'OTHER');
--> statement-breakpoint
CREATE TYPE "hr_expense_status" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
--> statement-breakpoint
CREATE TYPE "hr_reimbursement_status" AS ENUM ('PENDING', 'PAID');
--> statement-breakpoint
CREATE TYPE "hr_fuel_status" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'FLAGGED', 'REIMBURSED');
--> statement-breakpoint
CREATE TYPE "hr_memo_status" AS ENUM ('PENDING', 'VERIFIED', 'CONFIRMED', 'APPROVED', 'REJECTED');
--> statement-breakpoint
CREATE TYPE "hr_hall_status" AS ENUM ('ACTIVE', 'MAINTENANCE');
--> statement-breakpoint
CREATE TYPE "hr_hall_arrangement" AS ENUM ('THEATER', 'U_SHAPE', 'BOARDROOM', 'CLASSROOM');
--> statement-breakpoint
CREATE TYPE "hr_hall_booking_status" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');
--> statement-breakpoint
CREATE TYPE "hr_support_visit_type" AS ENUM ('REMOTE', 'ONCALL', 'ONPREMISE');
--> statement-breakpoint
CREATE TYPE "hr_support_visit_status" AS ENUM ('PENDING', 'ONGOING', 'RESOLVED', 'ESCALATED');
--> statement-breakpoint
CREATE TYPE "hr_field_visit_type" AS ENUM ('CLIENT_MEETING', 'TECHNICAL_SUPPORT', 'BANK', 'CUSTOMS', 'OTHER');
--> statement-breakpoint
CREATE TABLE "hr_attendance" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "employee_id" uuid NOT NULL,
  "punch_date" date NOT NULL,
  "in_time" varchar(8),
  "out_time" varchar(8),
  "duration" varchar(20),
  "att_status" varchar(100) NOT NULL,
  "source" varchar(20) DEFAULT 'MANUAL' NOT NULL,
  "created_by" uuid,
  "updated_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hr_leave_requests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "employee_id" uuid NOT NULL,
  "leave_type" "hr_leave_type_code" NOT NULL,
  "substitute_id" uuid,
  "referred_by" uuid,
  "peer_vouched" boolean DEFAULT false NOT NULL,
  "start_date" date NOT NULL,
  "end_date" date NOT NULL,
  "days" numeric(4, 2) NOT NULL,
  "is_half_day" boolean DEFAULT false NOT NULL,
  "reason" text,
  "status" "hr_leave_request_status" DEFAULT 'PENDING' NOT NULL,
  "approved_by" uuid,
  "admin_comment" text,
  "created_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hr_expenses" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "employee_id" uuid NOT NULL,
  "expense_type" "hr_expense_type" NOT NULL,
  "amount" numeric(12, 2) NOT NULL,
  "description" text,
  "request_date" date NOT NULL,
  "origin" varchar(100),
  "destination" varchar(100),
  "status" "hr_expense_status" DEFAULT 'PENDING' NOT NULL,
  "approved_by" uuid,
  "remarks" text,
  "reimbursement_status" "hr_reimbursement_status" DEFAULT 'PENDING' NOT NULL,
  "created_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hr_fuel_settings" (
  "tenant_id" uuid PRIMARY KEY NOT NULL,
  "threshold" numeric(12, 2) DEFAULT '250.00' NOT NULL,
  "updated_by" uuid,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hr_fuel_records" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "employee_id" uuid NOT NULL,
  "vehicle_no" varchar(50) NOT NULL,
  "fuel_date" date NOT NULL,
  "amount" numeric(12, 2) NOT NULL,
  "liters" numeric(10, 2) NOT NULL,
  "purpose" text,
  "status" "hr_fuel_status" DEFAULT 'PENDING' NOT NULL,
  "approved_by" uuid,
  "reimbursement_status" varchar(20) DEFAULT 'PENDING' NOT NULL,
  "reimbursed_at" timestamp with time zone,
  "reimbursed_by" uuid,
  "payment_reference" varchar(100),
  "created_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hr_memos" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "title" varchar(255) NOT NULL,
  "content" text NOT NULL,
  "raised_by" uuid NOT NULL,
  "verifier_id" uuid,
  "current_step" integer DEFAULT 2 NOT NULL,
  "status" "hr_memo_status" DEFAULT 'PENDING' NOT NULL,
  "verifier_signed_by" uuid,
  "hod_signed_by" uuid,
  "ceo_signed_by" uuid,
  "created_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hr_memo_attachments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "memo_id" uuid NOT NULL,
  "file_url" varchar(1000) NOT NULL,
  "file_name" varchar(255) NOT NULL,
  "mime_type" varchar(100),
  "file_size" integer,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hr_meeting_halls" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "hall_name" varchar(100) NOT NULL,
  "location" varchar(100),
  "capacity" integer,
  "arrangement_type" "hr_hall_arrangement" DEFAULT 'BOARDROOM' NOT NULL,
  "status" "hr_hall_status" DEFAULT 'ACTIVE' NOT NULL,
  "created_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hr_hall_bookings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "hall_id" uuid NOT NULL,
  "employee_id" uuid NOT NULL,
  "booking_date" date NOT NULL,
  "start_time" varchar(8) NOT NULL,
  "end_time" varchar(8) NOT NULL,
  "reason" text,
  "status" "hr_hall_booking_status" DEFAULT 'PENDING' NOT NULL,
  "created_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hr_partners" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "name" varchar(255) NOT NULL,
  "portal_url" varchar(500),
  "website_url" varchar(500),
  "logo_url" varchar(1000),
  "logo_file_name" varchar(255),
  "logo_mime_type" varchar(100),
  "logo_size" integer,
  "created_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hr_partner_assignments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "partner_id" uuid NOT NULL,
  "employee_id" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hr_support_visits" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "visit_number" varchar(30) NOT NULL,
  "customer_id" uuid,
  "client_name" varchar(255) NOT NULL,
  "dept_name" varchar(100),
  "technician_id" uuid,
  "team_members" text,
  "visit_date" date NOT NULL,
  "client_call_time" varchar(8),
  "time_started" varchar(8),
  "time_ended" varchar(8),
  "total_hours" varchar(20),
  "visit_type" "hr_support_visit_type" DEFAULT 'ONPREMISE' NOT NULL,
  "category" varchar(100),
  "priority" varchar(50),
  "issue_description" text,
  "action_taken" text,
  "parts_used" text,
  "status" "hr_support_visit_status" DEFAULT 'PENDING' NOT NULL,
  "created_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hr_field_visits" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "employee_id" uuid NOT NULL,
  "agenda" varchar(255) NOT NULL,
  "visit_type" "hr_field_visit_type" NOT NULL,
  "out_time" varchar(8) NOT NULL,
  "in_time" varchar(8),
  "remarks" text,
  "visit_date" date NOT NULL,
  "created_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "hr_attendance" ADD CONSTRAINT "hr_attendance_tenant_id_organizations_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "hr_attendance" ADD CONSTRAINT "hr_attendance_employee_id_hr_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "hr_employees"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "hr_attendance" ADD CONSTRAINT "hr_attendance_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE set null;
--> statement-breakpoint
ALTER TABLE "hr_attendance" ADD CONSTRAINT "hr_attendance_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE set null;
--> statement-breakpoint
CREATE UNIQUE INDEX "hr_attendance_tenant_employee_date_unique" ON "hr_attendance" ("tenant_id", "employee_id", "punch_date");
--> statement-breakpoint
CREATE INDEX "hr_attendance_tenant_date_idx" ON "hr_attendance" ("tenant_id", "punch_date");
--> statement-breakpoint
CREATE INDEX "hr_attendance_tenant_employee_idx" ON "hr_attendance" ("tenant_id", "employee_id");
--> statement-breakpoint
ALTER TABLE "hr_leave_requests" ADD CONSTRAINT "hr_leave_requests_tenant_id_organizations_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "hr_leave_requests" ADD CONSTRAINT "hr_leave_requests_employee_id_hr_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "hr_employees"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "hr_leave_requests" ADD CONSTRAINT "hr_leave_requests_substitute_id_hr_employees_id_fk" FOREIGN KEY ("substitute_id") REFERENCES "hr_employees"("id") ON DELETE set null;
--> statement-breakpoint
ALTER TABLE "hr_leave_requests" ADD CONSTRAINT "hr_leave_requests_referred_by_hr_employees_id_fk" FOREIGN KEY ("referred_by") REFERENCES "hr_employees"("id") ON DELETE set null;
--> statement-breakpoint
ALTER TABLE "hr_leave_requests" ADD CONSTRAINT "hr_leave_requests_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE set null;
--> statement-breakpoint
ALTER TABLE "hr_leave_requests" ADD CONSTRAINT "hr_leave_requests_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE set null;
--> statement-breakpoint
CREATE INDEX "hr_leave_requests_tenant_status_idx" ON "hr_leave_requests" ("tenant_id", "status");
--> statement-breakpoint
CREATE INDEX "hr_leave_requests_tenant_employee_idx" ON "hr_leave_requests" ("tenant_id", "employee_id");
--> statement-breakpoint
CREATE INDEX "hr_leave_requests_tenant_dates_idx" ON "hr_leave_requests" ("tenant_id", "start_date", "end_date");
--> statement-breakpoint
ALTER TABLE "hr_expenses" ADD CONSTRAINT "hr_expenses_tenant_id_organizations_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "hr_expenses" ADD CONSTRAINT "hr_expenses_employee_id_hr_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "hr_employees"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "hr_expenses" ADD CONSTRAINT "hr_expenses_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE set null;
--> statement-breakpoint
ALTER TABLE "hr_expenses" ADD CONSTRAINT "hr_expenses_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE set null;
--> statement-breakpoint
CREATE INDEX "hr_expenses_tenant_type_status_idx" ON "hr_expenses" ("tenant_id", "expense_type", "status");
--> statement-breakpoint
CREATE INDEX "hr_expenses_tenant_employee_idx" ON "hr_expenses" ("tenant_id", "employee_id");
--> statement-breakpoint
ALTER TABLE "hr_fuel_settings" ADD CONSTRAINT "hr_fuel_settings_tenant_id_organizations_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "hr_fuel_settings" ADD CONSTRAINT "hr_fuel_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE set null;
--> statement-breakpoint
ALTER TABLE "hr_fuel_records" ADD CONSTRAINT "hr_fuel_records_tenant_id_organizations_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "hr_fuel_records" ADD CONSTRAINT "hr_fuel_records_employee_id_hr_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "hr_employees"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "hr_fuel_records" ADD CONSTRAINT "hr_fuel_records_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE set null;
--> statement-breakpoint
ALTER TABLE "hr_fuel_records" ADD CONSTRAINT "hr_fuel_records_reimbursed_by_users_id_fk" FOREIGN KEY ("reimbursed_by") REFERENCES "users"("id") ON DELETE set null;
--> statement-breakpoint
ALTER TABLE "hr_fuel_records" ADD CONSTRAINT "hr_fuel_records_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE set null;
--> statement-breakpoint
CREATE INDEX "hr_fuel_records_tenant_status_idx" ON "hr_fuel_records" ("tenant_id", "status");
--> statement-breakpoint
CREATE INDEX "hr_fuel_records_tenant_employee_idx" ON "hr_fuel_records" ("tenant_id", "employee_id");
--> statement-breakpoint
ALTER TABLE "hr_memos" ADD CONSTRAINT "hr_memos_tenant_id_organizations_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "hr_memos" ADD CONSTRAINT "hr_memos_raised_by_hr_employees_id_fk" FOREIGN KEY ("raised_by") REFERENCES "hr_employees"("id") ON DELETE restrict;
--> statement-breakpoint
ALTER TABLE "hr_memos" ADD CONSTRAINT "hr_memos_verifier_id_hr_employees_id_fk" FOREIGN KEY ("verifier_id") REFERENCES "hr_employees"("id") ON DELETE set null;
--> statement-breakpoint
ALTER TABLE "hr_memos" ADD CONSTRAINT "hr_memos_verifier_signed_by_hr_employees_id_fk" FOREIGN KEY ("verifier_signed_by") REFERENCES "hr_employees"("id") ON DELETE set null;
--> statement-breakpoint
ALTER TABLE "hr_memos" ADD CONSTRAINT "hr_memos_hod_signed_by_hr_employees_id_fk" FOREIGN KEY ("hod_signed_by") REFERENCES "hr_employees"("id") ON DELETE set null;
--> statement-breakpoint
ALTER TABLE "hr_memos" ADD CONSTRAINT "hr_memos_ceo_signed_by_hr_employees_id_fk" FOREIGN KEY ("ceo_signed_by") REFERENCES "hr_employees"("id") ON DELETE set null;
--> statement-breakpoint
ALTER TABLE "hr_memos" ADD CONSTRAINT "hr_memos_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE set null;
--> statement-breakpoint
CREATE INDEX "hr_memos_tenant_status_idx" ON "hr_memos" ("tenant_id", "status");
--> statement-breakpoint
ALTER TABLE "hr_memo_attachments" ADD CONSTRAINT "hr_memo_attachments_tenant_id_organizations_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "hr_memo_attachments" ADD CONSTRAINT "hr_memo_attachments_memo_id_hr_memos_id_fk" FOREIGN KEY ("memo_id") REFERENCES "hr_memos"("id") ON DELETE cascade;
--> statement-breakpoint
CREATE INDEX "hr_memo_attachments_memo_idx" ON "hr_memo_attachments" ("tenant_id", "memo_id");
--> statement-breakpoint
ALTER TABLE "hr_meeting_halls" ADD CONSTRAINT "hr_meeting_halls_tenant_id_organizations_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "hr_meeting_halls" ADD CONSTRAINT "hr_meeting_halls_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE set null;
--> statement-breakpoint
CREATE INDEX "hr_meeting_halls_tenant_name_idx" ON "hr_meeting_halls" ("tenant_id", "hall_name");
--> statement-breakpoint
ALTER TABLE "hr_hall_bookings" ADD CONSTRAINT "hr_hall_bookings_tenant_id_organizations_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "hr_hall_bookings" ADD CONSTRAINT "hr_hall_bookings_hall_id_hr_meeting_halls_id_fk" FOREIGN KEY ("hall_id") REFERENCES "hr_meeting_halls"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "hr_hall_bookings" ADD CONSTRAINT "hr_hall_bookings_employee_id_hr_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "hr_employees"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "hr_hall_bookings" ADD CONSTRAINT "hr_hall_bookings_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE set null;
--> statement-breakpoint
CREATE INDEX "hr_hall_bookings_tenant_hall_date_idx" ON "hr_hall_bookings" ("tenant_id", "hall_id", "booking_date");
--> statement-breakpoint
ALTER TABLE "hr_partners" ADD CONSTRAINT "hr_partners_tenant_id_organizations_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "hr_partners" ADD CONSTRAINT "hr_partners_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE set null;
--> statement-breakpoint
CREATE INDEX "hr_partners_tenant_name_idx" ON "hr_partners" ("tenant_id", "name");
--> statement-breakpoint
ALTER TABLE "hr_partner_assignments" ADD CONSTRAINT "hr_partner_assignments_tenant_id_organizations_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "hr_partner_assignments" ADD CONSTRAINT "hr_partner_assignments_partner_id_hr_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "hr_partners"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "hr_partner_assignments" ADD CONSTRAINT "hr_partner_assignments_employee_id_hr_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "hr_employees"("id") ON DELETE cascade;
--> statement-breakpoint
CREATE UNIQUE INDEX "hr_partner_assignments_unique" ON "hr_partner_assignments" ("tenant_id", "partner_id", "employee_id");
--> statement-breakpoint
ALTER TABLE "hr_support_visits" ADD CONSTRAINT "hr_support_visits_tenant_id_organizations_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "hr_support_visits" ADD CONSTRAINT "hr_support_visits_customer_id_sales_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "sales_customers"("id") ON DELETE set null;
--> statement-breakpoint
ALTER TABLE "hr_support_visits" ADD CONSTRAINT "hr_support_visits_technician_id_hr_employees_id_fk" FOREIGN KEY ("technician_id") REFERENCES "hr_employees"("id") ON DELETE set null;
--> statement-breakpoint
ALTER TABLE "hr_support_visits" ADD CONSTRAINT "hr_support_visits_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE set null;
--> statement-breakpoint
CREATE UNIQUE INDEX "hr_support_visits_tenant_number_unique" ON "hr_support_visits" ("tenant_id", "visit_number");
--> statement-breakpoint
CREATE INDEX "hr_support_visits_tenant_date_idx" ON "hr_support_visits" ("tenant_id", "visit_date");
--> statement-breakpoint
CREATE INDEX "hr_support_visits_tenant_tech_idx" ON "hr_support_visits" ("tenant_id", "technician_id");
--> statement-breakpoint
ALTER TABLE "hr_field_visits" ADD CONSTRAINT "hr_field_visits_tenant_id_organizations_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "hr_field_visits" ADD CONSTRAINT "hr_field_visits_employee_id_hr_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "hr_employees"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "hr_field_visits" ADD CONSTRAINT "hr_field_visits_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE set null;
--> statement-breakpoint
CREATE INDEX "hr_field_visits_tenant_emp_date_idx" ON "hr_field_visits" ("tenant_id", "employee_id", "visit_date");
--> statement-breakpoint
ALTER TABLE "hr_attendance" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "hr_attendance" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "hr_attendance_tenant_isolation" ON "hr_attendance" USING ("tenant_id" = "app"."current_tenant_id"()) WITH CHECK ("tenant_id" = "app"."current_tenant_id"());
--> statement-breakpoint
ALTER TABLE "hr_leave_requests" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "hr_leave_requests" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "hr_leave_requests_tenant_isolation" ON "hr_leave_requests" USING ("tenant_id" = "app"."current_tenant_id"()) WITH CHECK ("tenant_id" = "app"."current_tenant_id"());
--> statement-breakpoint
ALTER TABLE "hr_expenses" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "hr_expenses" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "hr_expenses_tenant_isolation" ON "hr_expenses" USING ("tenant_id" = "app"."current_tenant_id"()) WITH CHECK ("tenant_id" = "app"."current_tenant_id"());
--> statement-breakpoint
ALTER TABLE "hr_fuel_settings" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "hr_fuel_settings" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "hr_fuel_settings_tenant_isolation" ON "hr_fuel_settings" USING ("tenant_id" = "app"."current_tenant_id"()) WITH CHECK ("tenant_id" = "app"."current_tenant_id"());
--> statement-breakpoint
ALTER TABLE "hr_fuel_records" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "hr_fuel_records" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "hr_fuel_records_tenant_isolation" ON "hr_fuel_records" USING ("tenant_id" = "app"."current_tenant_id"()) WITH CHECK ("tenant_id" = "app"."current_tenant_id"());
--> statement-breakpoint
ALTER TABLE "hr_memos" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "hr_memos" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "hr_memos_tenant_isolation" ON "hr_memos" USING ("tenant_id" = "app"."current_tenant_id"()) WITH CHECK ("tenant_id" = "app"."current_tenant_id"());
--> statement-breakpoint
ALTER TABLE "hr_memo_attachments" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "hr_memo_attachments" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "hr_memo_attachments_tenant_isolation" ON "hr_memo_attachments" USING ("tenant_id" = "app"."current_tenant_id"()) WITH CHECK ("tenant_id" = "app"."current_tenant_id"());
--> statement-breakpoint
ALTER TABLE "hr_meeting_halls" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "hr_meeting_halls" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "hr_meeting_halls_tenant_isolation" ON "hr_meeting_halls" USING ("tenant_id" = "app"."current_tenant_id"()) WITH CHECK ("tenant_id" = "app"."current_tenant_id"());
--> statement-breakpoint
ALTER TABLE "hr_hall_bookings" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "hr_hall_bookings" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "hr_hall_bookings_tenant_isolation" ON "hr_hall_bookings" USING ("tenant_id" = "app"."current_tenant_id"()) WITH CHECK ("tenant_id" = "app"."current_tenant_id"());
--> statement-breakpoint
ALTER TABLE "hr_partners" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "hr_partners" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "hr_partners_tenant_isolation" ON "hr_partners" USING ("tenant_id" = "app"."current_tenant_id"()) WITH CHECK ("tenant_id" = "app"."current_tenant_id"());
--> statement-breakpoint
ALTER TABLE "hr_partner_assignments" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "hr_partner_assignments" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "hr_partner_assignments_tenant_isolation" ON "hr_partner_assignments" USING ("tenant_id" = "app"."current_tenant_id"()) WITH CHECK ("tenant_id" = "app"."current_tenant_id"());
--> statement-breakpoint
ALTER TABLE "hr_support_visits" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "hr_support_visits" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "hr_support_visits_tenant_isolation" ON "hr_support_visits" USING ("tenant_id" = "app"."current_tenant_id"()) WITH CHECK ("tenant_id" = "app"."current_tenant_id"());
--> statement-breakpoint
ALTER TABLE "hr_field_visits" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "hr_field_visits" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "hr_field_visits_tenant_isolation" ON "hr_field_visits" USING ("tenant_id" = "app"."current_tenant_id"()) WITH CHECK ("tenant_id" = "app"."current_tenant_id"());
--> statement-breakpoint
INSERT INTO "platform_permissions" ("code", "description") VALUES
  ('hr.attendance.manage', 'Record and review company attendance'),
  ('hr.leaves.manage', 'Approve leave and edit leave balances'),
  ('hr.expenses.manage', 'Approve TA/DA and fuel reimbursements'),
  ('hr.memos.manage', 'Create and process internal memos'),
  ('hr.halls.manage', 'Manage meeting halls and bookings'),
  ('hr.partners.manage', 'Manage vendor partners and assignments'),
  ('hr.visits.manage', 'Manage support visits and field visits')
ON CONFLICT ("code") DO NOTHING;
--> statement-breakpoint
ALTER TABLE "platform_role_permissions" NO FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
INSERT INTO "platform_role_permissions" ("organization_id", "role", "permission_id")
SELECT organizations.id, assignments.role, permissions.id
FROM "organizations" AS organizations
CROSS JOIN (VALUES
  ('OWNER'::"user_role", 'hr.attendance.manage'),
  ('SUPER_ADMIN'::"user_role", 'hr.attendance.manage'),
  ('ADMIN'::"user_role", 'hr.attendance.manage'),
  ('HR'::"user_role", 'hr.attendance.manage'),
  ('OPERATIONS'::"user_role", 'hr.attendance.manage'),
  ('MANAGEMENT'::"user_role", 'hr.attendance.manage'),
  ('HEAD'::"user_role", 'hr.attendance.manage'),
  ('OWNER'::"user_role", 'hr.leaves.manage'),
  ('SUPER_ADMIN'::"user_role", 'hr.leaves.manage'),
  ('ADMIN'::"user_role", 'hr.leaves.manage'),
  ('HR'::"user_role", 'hr.leaves.manage'),
  ('OPERATIONS'::"user_role", 'hr.leaves.manage'),
  ('MANAGEMENT'::"user_role", 'hr.leaves.manage'),
  ('HEAD'::"user_role", 'hr.leaves.manage'),
  ('OWNER'::"user_role", 'hr.expenses.manage'),
  ('SUPER_ADMIN'::"user_role", 'hr.expenses.manage'),
  ('ADMIN'::"user_role", 'hr.expenses.manage'),
  ('HR'::"user_role", 'hr.expenses.manage'),
  ('OPERATIONS'::"user_role", 'hr.expenses.manage'),
  ('OWNER'::"user_role", 'hr.memos.manage'),
  ('SUPER_ADMIN'::"user_role", 'hr.memos.manage'),
  ('ADMIN'::"user_role", 'hr.memos.manage'),
  ('HR'::"user_role", 'hr.memos.manage'),
  ('HEAD'::"user_role", 'hr.memos.manage'),
  ('OWNER'::"user_role", 'hr.halls.manage'),
  ('SUPER_ADMIN'::"user_role", 'hr.halls.manage'),
  ('ADMIN'::"user_role", 'hr.halls.manage'),
  ('HR'::"user_role", 'hr.halls.manage'),
  ('OPERATIONS'::"user_role", 'hr.halls.manage'),
  ('OWNER'::"user_role", 'hr.partners.manage'),
  ('SUPER_ADMIN'::"user_role", 'hr.partners.manage'),
  ('ADMIN'::"user_role", 'hr.partners.manage'),
  ('HR'::"user_role", 'hr.partners.manage'),
  ('OWNER'::"user_role", 'hr.visits.manage'),
  ('SUPER_ADMIN'::"user_role", 'hr.visits.manage'),
  ('ADMIN'::"user_role", 'hr.visits.manage'),
  ('HR'::"user_role", 'hr.visits.manage'),
  ('OPERATIONS'::"user_role", 'hr.visits.manage'),
  ('HEAD'::"user_role", 'hr.visits.manage')
) AS assignments(role, permission_code)
INNER JOIN "platform_permissions" AS permissions ON permissions.code = assignments.permission_code
ON CONFLICT DO NOTHING;
--> statement-breakpoint
ALTER TABLE "platform_role_permissions" FORCE ROW LEVEL SECURITY;
