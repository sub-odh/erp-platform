CREATE TABLE "platform_notifications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "recipient_user_id" uuid NOT NULL,
  "actor_user_id" uuid,
  "type" varchar(100) NOT NULL,
  "title" varchar(200) NOT NULL,
  "message" varchar(1000) NOT NULL,
  "action_url" varchar(1000),
  "entity_type" varchar(100),
  "entity_id" uuid,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "read_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_notification_email_outbox" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "notification_id" uuid NOT NULL,
  "recipient_email" varchar(320) NOT NULL,
  "subject" varchar(200) NOT NULL,
  "body" varchar(5000) NOT NULL,
  "status" varchar(20) DEFAULT 'PENDING' NOT NULL,
  "attempts" integer DEFAULT 0 NOT NULL,
  "next_attempt_at" timestamp with time zone DEFAULT now() NOT NULL,
  "sent_at" timestamp with time zone,
  "last_error" varchar(1000),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "platform_notifications" ADD CONSTRAINT "platform_notifications_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "platform_notifications" ADD CONSTRAINT "platform_notifications_recipient_user_id_users_id_fk" FOREIGN KEY ("recipient_user_id") REFERENCES "public"."users"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "platform_notifications" ADD CONSTRAINT "platform_notifications_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null;
--> statement-breakpoint
ALTER TABLE "platform_notification_email_outbox" ADD CONSTRAINT "platform_notification_email_outbox_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "platform_notification_email_outbox" ADD CONSTRAINT "platform_notification_email_outbox_notification_id_platform_notifications_id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."platform_notifications"("id") ON DELETE cascade;
--> statement-breakpoint
CREATE INDEX "platform_notifications_recipient_created_index" ON "platform_notifications" ("organization_id", "recipient_user_id", "created_at");
--> statement-breakpoint
CREATE INDEX "platform_notifications_recipient_read_index" ON "platform_notifications" ("organization_id", "recipient_user_id", "read_at");
--> statement-breakpoint
CREATE INDEX "platform_notification_outbox_pending_index" ON "platform_notification_email_outbox" ("organization_id", "status", "next_attempt_at");
--> statement-breakpoint
ALTER TABLE "platform_notifications" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "platform_notifications" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "platform_notifications_tenant_all" ON "platform_notifications" USING ("organization_id" = "app"."current_tenant_id"()) WITH CHECK ("organization_id" = "app"."current_tenant_id"());
--> statement-breakpoint
ALTER TABLE "platform_notification_email_outbox" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "platform_notification_email_outbox" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "platform_notification_outbox_tenant_all" ON "platform_notification_email_outbox" USING ("organization_id" = "app"."current_tenant_id"()) WITH CHECK ("organization_id" = "app"."current_tenant_id"());
--> statement-breakpoint
INSERT INTO "platform_permissions" ("code", "description") VALUES ('platform.notifications.manage', 'Manage organization notification delivery and outbox');
--> statement-breakpoint
ALTER TABLE "platform_role_permissions" NO FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
INSERT INTO "platform_role_permissions" ("organization_id", "role", "permission_id")
SELECT organizations.id, roles.role, permissions.id
FROM "organizations" AS organizations
CROSS JOIN (VALUES ('OWNER'::"user_role"), ('ADMIN'::"user_role")) AS roles(role)
INNER JOIN "platform_permissions" AS permissions ON permissions.code = 'platform.notifications.manage';
--> statement-breakpoint
ALTER TABLE "platform_role_permissions" FORCE ROW LEVEL SECURITY;
