CREATE TYPE "procurement_guarantee_type" AS ENUM ('BG', 'PG');--> statement-breakpoint
CREATE TYPE "procurement_guarantee_status" AS ENUM ('ACTIVE', 'RELEASED');--> statement-breakpoint
CREATE TABLE "procurement_tenders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"submission_date" date NOT NULL,
	"closing_date" date,
	"details" text,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);--> statement-breakpoint
CREATE TABLE "procurement_guarantees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"guarantee_type" "procurement_guarantee_type" NOT NULL,
	"client_name" varchar(255) NOT NULL,
	"tender_details" text NOT NULL,
	"bank_name_branch" varchar(255) NOT NULL,
	"amount" numeric(18, 2) DEFAULT '0.00' NOT NULL,
	"submission_date" date NOT NULL,
	"expiry_date" date NOT NULL,
	"assigned_person" varchar(155),
	"document_url" varchar(500),
	"status" "procurement_guarantee_status" DEFAULT 'ACTIVE' NOT NULL,
	"release_date" date,
	"release_remarks" text,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);--> statement-breakpoint
ALTER TABLE "procurement_tenders" ADD CONSTRAINT "procurement_tenders_tenant_id_organizations_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE cascade;--> statement-breakpoint
ALTER TABLE "procurement_tenders" ADD CONSTRAINT "procurement_tenders_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE set null;--> statement-breakpoint
ALTER TABLE "procurement_tenders" ADD CONSTRAINT "procurement_tenders_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE set null;--> statement-breakpoint
ALTER TABLE "procurement_guarantees" ADD CONSTRAINT "procurement_guarantees_tenant_id_organizations_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE cascade;--> statement-breakpoint
ALTER TABLE "procurement_guarantees" ADD CONSTRAINT "procurement_guarantees_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE set null;--> statement-breakpoint
ALTER TABLE "procurement_guarantees" ADD CONSTRAINT "procurement_guarantees_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE set null;--> statement-breakpoint
CREATE INDEX "procurement_tenders_tenant_submission_idx" ON "procurement_tenders" ("tenant_id","submission_date");--> statement-breakpoint
CREATE INDEX "procurement_guarantees_tenant_status_idx" ON "procurement_guarantees" ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "procurement_guarantees_tenant_expiry_idx" ON "procurement_guarantees" ("tenant_id","expiry_date");--> statement-breakpoint
ALTER TABLE "procurement_tenders" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "procurement_tenders" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "procurement_tenders_tenant_isolation" ON "procurement_tenders" USING ("tenant_id" = "app"."current_tenant_id"()) WITH CHECK ("tenant_id" = "app"."current_tenant_id"());--> statement-breakpoint
ALTER TABLE "procurement_guarantees" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "procurement_guarantees" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "procurement_guarantees_tenant_isolation" ON "procurement_guarantees" USING ("tenant_id" = "app"."current_tenant_id"()) WITH CHECK ("tenant_id" = "app"."current_tenant_id"());
