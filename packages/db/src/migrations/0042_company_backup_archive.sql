CREATE TABLE "company_backup_schedules" (
	"organization_id" uuid PRIMARY KEY NOT NULL,
	"frequency" varchar(20) DEFAULT 'daily' NOT NULL,
	"backup_time" varchar(8) DEFAULT '02:00:00' NOT NULL,
	"backup_day" integer DEFAULT 1 NOT NULL,
	"retention_max_files" integer DEFAULT 10 NOT NULL,
	"retention_days" integer DEFAULT 30 NOT NULL,
	"last_automated_run" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_backup_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"filename" varchar(255) NOT NULL,
	"kind" varchar(20) NOT NULL,
	"size_bytes" integer NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "company_backup_schedules" ADD CONSTRAINT "company_backup_schedules_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "company_backup_files" ADD CONSTRAINT "company_backup_files_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "company_backup_files_organization_created_idx" ON "company_backup_files" USING btree ("organization_id","created_at");
--> statement-breakpoint
ALTER TABLE "company_backup_schedules" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "company_backup_schedules" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "company_backup_schedules_tenant_isolation" ON "company_backup_schedules"
  USING ("organization_id" = "app"."current_tenant_id"())
  WITH CHECK ("organization_id" = "app"."current_tenant_id"());
--> statement-breakpoint
ALTER TABLE "company_backup_files" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "company_backup_files" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "company_backup_files_tenant_isolation" ON "company_backup_files"
  USING ("organization_id" = "app"."current_tenant_id"())
  WITH CHECK ("organization_id" = "app"."current_tenant_id"());
