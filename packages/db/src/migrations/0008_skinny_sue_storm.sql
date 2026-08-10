CREATE TYPE "public"."sales_lead_status" AS ENUM('NEW', 'CONTACTED', 'QUALIFIED', 'DISQUALIFIED', 'CONVERTED');--> statement-breakpoint
CREATE TYPE "public"."sales_opportunity_status" AS ENUM('OPEN', 'WON', 'LOST');--> statement-breakpoint
CREATE TABLE "sales_pipeline_stages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"position" integer NOT NULL,
	"probability" integer DEFAULT 0 NOT NULL,
	"is_closed" boolean DEFAULT false NOT NULL,
	"is_won" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sales_leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"company_name" varchar(200),
	"job_title" varchar(150),
	"email" varchar(320),
	"phone" varchar(50),
	"mobile" varchar(50),
	"source" varchar(100),
	"status" "sales_lead_status" DEFAULT 'NEW' NOT NULL,
	"owner_user_id" uuid,
	"notes" text,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"converted_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sales_opportunities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(200) NOT NULL,
	"customer_id" uuid,
	"lead_id" uuid,
	"stage_id" uuid NOT NULL,
	"owner_user_id" uuid,
	"amount" numeric(18, 2) DEFAULT '0.00' NOT NULL,
	"probability" integer DEFAULT 0 NOT NULL,
	"expected_close_date" date,
	"status" "sales_opportunity_status" DEFAULT 'OPEN' NOT NULL,
	"loss_reason" varchar(500),
	"description" text,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"closed_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "sales_pipeline_stages" ADD CONSTRAINT "sales_pipeline_stages_tenant_id_organizations_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_pipeline_stages" ADD CONSTRAINT "sales_pipeline_stages_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_pipeline_stages" ADD CONSTRAINT "sales_pipeline_stages_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_leads" ADD CONSTRAINT "sales_leads_tenant_id_organizations_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_leads" ADD CONSTRAINT "sales_leads_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_leads" ADD CONSTRAINT "sales_leads_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_leads" ADD CONSTRAINT "sales_leads_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_opportunities" ADD CONSTRAINT "sales_opportunities_tenant_id_organizations_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_opportunities" ADD CONSTRAINT "sales_opportunities_customer_id_sales_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."sales_customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_opportunities" ADD CONSTRAINT "sales_opportunities_lead_id_sales_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."sales_leads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_opportunities" ADD CONSTRAINT "sales_opportunities_stage_id_sales_pipeline_stages_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."sales_pipeline_stages"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_opportunities" ADD CONSTRAINT "sales_opportunities_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_opportunities" ADD CONSTRAINT "sales_opportunities_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_opportunities" ADD CONSTRAINT "sales_opportunities_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "sales_pipeline_stages_tenant_name_unique" ON "sales_pipeline_stages" USING btree ("tenant_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "sales_pipeline_stages_tenant_position_unique" ON "sales_pipeline_stages" USING btree ("tenant_id","position");--> statement-breakpoint
CREATE INDEX "sales_pipeline_stages_tenant_idx" ON "sales_pipeline_stages" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "sales_pipeline_stages_tenant_active_idx" ON "sales_pipeline_stages" USING btree ("tenant_id","is_active");--> statement-breakpoint
CREATE INDEX "sales_leads_tenant_idx" ON "sales_leads" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "sales_leads_tenant_status_idx" ON "sales_leads" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "sales_leads_tenant_owner_idx" ON "sales_leads" USING btree ("tenant_id","owner_user_id");--> statement-breakpoint
CREATE INDEX "sales_leads_tenant_email_idx" ON "sales_leads" USING btree ("tenant_id","email");--> statement-breakpoint
CREATE INDEX "sales_leads_tenant_created_at_idx" ON "sales_leads" USING btree ("tenant_id","created_at");--> statement-breakpoint
CREATE INDEX "sales_opportunities_tenant_idx" ON "sales_opportunities" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "sales_opportunities_tenant_stage_idx" ON "sales_opportunities" USING btree ("tenant_id","stage_id");--> statement-breakpoint
CREATE INDEX "sales_opportunities_tenant_status_idx" ON "sales_opportunities" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "sales_opportunities_tenant_owner_idx" ON "sales_opportunities" USING btree ("tenant_id","owner_user_id");--> statement-breakpoint
CREATE INDEX "sales_opportunities_tenant_customer_idx" ON "sales_opportunities" USING btree ("tenant_id","customer_id");--> statement-breakpoint
CREATE INDEX "sales_opportunities_tenant_lead_idx" ON "sales_opportunities" USING btree ("tenant_id","lead_id");--> statement-breakpoint
CREATE INDEX "sales_opportunities_tenant_expected_close_idx" ON "sales_opportunities" USING btree ("tenant_id","expected_close_date");