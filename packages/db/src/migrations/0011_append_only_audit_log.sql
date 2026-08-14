CREATE TABLE "platform_audit_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "actor_user_id" uuid NOT NULL,
  "action" varchar(200) NOT NULL,
  "entity_type" varchar(100) NOT NULL,
  "entity_id" uuid,
  "request_method" varchar(10) NOT NULL,
  "request_path" varchar(500) NOT NULL,
  "request_id" varchar(100),
  "ip_address" varchar(64),
  "user_agent" varchar(500),
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "platform_audit_logs" ADD CONSTRAINT "platform_audit_logs_organization_id_organizations_id_fk"
  FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "platform_audit_logs_org_created_index"
  ON "platform_audit_logs" USING btree ("organization_id", "created_at");
--> statement-breakpoint
CREATE INDEX "platform_audit_logs_org_actor_index"
  ON "platform_audit_logs" USING btree ("organization_id", "actor_user_id");
--> statement-breakpoint
CREATE INDEX "platform_audit_logs_org_entity_index"
  ON "platform_audit_logs" USING btree ("organization_id", "entity_type", "entity_id");
--> statement-breakpoint
ALTER TABLE "platform_audit_logs" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "platform_audit_logs" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "platform_audit_logs_tenant_select" ON "platform_audit_logs"
  FOR SELECT USING ("organization_id" = "app"."current_tenant_id"());
--> statement-breakpoint
CREATE POLICY "platform_audit_logs_tenant_insert" ON "platform_audit_logs"
  FOR INSERT WITH CHECK ("organization_id" = "app"."current_tenant_id"());
--> statement-breakpoint
CREATE OR REPLACE FUNCTION "app"."reject_audit_log_mutation"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are append-only';
END;
$$;
--> statement-breakpoint
CREATE TRIGGER "platform_audit_logs_append_only"
  BEFORE UPDATE OR DELETE ON "platform_audit_logs"
  FOR EACH ROW EXECUTE FUNCTION "app"."reject_audit_log_mutation"();
--> statement-breakpoint
INSERT INTO "platform_permissions" ("code", "description")
VALUES ('platform.audit.read', 'View the organization audit trail');
--> statement-breakpoint
ALTER TABLE "platform_role_permissions" NO FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
INSERT INTO "platform_role_permissions" ("organization_id", "role", "permission_id")
SELECT organizations.id, roles.role, permissions.id
FROM "organizations" AS organizations
CROSS JOIN (VALUES ('OWNER'::"user_role"), ('ADMIN'::"user_role")) AS roles(role)
INNER JOIN "platform_permissions" AS permissions
  ON permissions.code = 'platform.audit.read';
--> statement-breakpoint
ALTER TABLE "platform_role_permissions" FORCE ROW LEVEL SECURITY;
