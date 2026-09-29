CREATE TABLE "ops_office_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"asset_name" varchar(255) NOT NULL,
	"category" varchar(150),
	"purchase_source" varchar(255),
	"purchase_price" numeric(18, 2) DEFAULT '0.00' NOT NULL,
	"purchase_date" date,
	"item_details" text,
	"current_location" varchar(255),
	"utilization_status" varchar(32) DEFAULT 'Available' NOT NULL,
	"tech_person_name" varchar(255),
	"tech_person_contact" varchar(255),
	"tech_person_email" varchar(255),
	"tech_usage_details" text,
	"tech_used_date" date,
	"poc_person_contact" varchar(255),
	"poc_person_email" varchar(255),
	"poc_company_name" varchar(255),
	"poc_client_name" varchar(255),
	"poc_start_date" date,
	"poc_taken_time" varchar(8),
	"return_deadline" date,
	"return_time" varchar(8),
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ops_office_assets" ADD CONSTRAINT "ops_office_assets_tenant_id_organizations_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "ops_office_assets" ADD CONSTRAINT "ops_office_assets_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE set null;
--> statement-breakpoint
ALTER TABLE "ops_office_assets" ADD CONSTRAINT "ops_office_assets_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE set null;
--> statement-breakpoint
CREATE INDEX "ops_office_assets_tenant_created_idx" ON "ops_office_assets" ("tenant_id","created_at");
--> statement-breakpoint
ALTER TABLE "ops_office_assets" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "ops_office_assets" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "ops_office_assets_tenant_isolation" ON "ops_office_assets" USING ("tenant_id" = "app"."current_tenant_id"()) WITH CHECK ("tenant_id" = "app"."current_tenant_id"());
