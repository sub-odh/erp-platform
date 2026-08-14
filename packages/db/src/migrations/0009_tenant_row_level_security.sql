CREATE SCHEMA IF NOT EXISTS "app";
--> statement-breakpoint
CREATE OR REPLACE FUNCTION "app"."current_tenant_id"()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('app.local_tenant_id', true), '')::uuid
$$;
--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD COLUMN "organization_id" uuid;
--> statement-breakpoint
UPDATE "auth_sessions"
SET "organization_id" = "users"."organization_id"
FROM "users"
WHERE "users"."id" = "auth_sessions"."user_id";
--> statement-breakpoint
ALTER TABLE "auth_sessions" ALTER COLUMN "organization_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_organization_id_organizations_id_fk"
  FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id")
  ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "auth_sessions_organization_id_index" ON "auth_sessions" USING btree ("organization_id");
--> statement-breakpoint
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "users" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "users_tenant_isolation" ON "users"
  USING ("organization_id" = "app"."current_tenant_id"())
  WITH CHECK ("organization_id" = "app"."current_tenant_id"());
--> statement-breakpoint
ALTER TABLE "auth_sessions" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "auth_sessions" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "auth_sessions_tenant_isolation" ON "auth_sessions"
  USING ("organization_id" = "app"."current_tenant_id"())
  WITH CHECK ("organization_id" = "app"."current_tenant_id"());
--> statement-breakpoint
ALTER TABLE "sales_customers" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "sales_customers" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "sales_customers_tenant_isolation" ON "sales_customers"
  USING ("tenant_id" = "app"."current_tenant_id"())
  WITH CHECK ("tenant_id" = "app"."current_tenant_id"());
--> statement-breakpoint
ALTER TABLE "sales_customer_contacts" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "sales_customer_contacts" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "sales_customer_contacts_tenant_isolation" ON "sales_customer_contacts"
  USING ("tenant_id" = "app"."current_tenant_id"())
  WITH CHECK ("tenant_id" = "app"."current_tenant_id"());
--> statement-breakpoint
ALTER TABLE "sales_pipeline_stages" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "sales_pipeline_stages" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "sales_pipeline_stages_tenant_isolation" ON "sales_pipeline_stages"
  USING ("tenant_id" = "app"."current_tenant_id"())
  WITH CHECK ("tenant_id" = "app"."current_tenant_id"());
--> statement-breakpoint
ALTER TABLE "sales_leads" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "sales_leads" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "sales_leads_tenant_isolation" ON "sales_leads"
  USING ("tenant_id" = "app"."current_tenant_id"())
  WITH CHECK ("tenant_id" = "app"."current_tenant_id"());
--> statement-breakpoint
ALTER TABLE "sales_opportunities" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "sales_opportunities" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "sales_opportunities_tenant_isolation" ON "sales_opportunities"
  USING ("tenant_id" = "app"."current_tenant_id"())
  WITH CHECK ("tenant_id" = "app"."current_tenant_id"());
