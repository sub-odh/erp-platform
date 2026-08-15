CREATE TYPE "public"."ops_inventory_asset_status" AS ENUM('IN_STOCK', 'SOLD', 'OUT_OF_STOCK', 'DELIVERED', 'DAMAGED', 'RETURNED', 'RMA');--> statement-breakpoint
CREATE TYPE "public"."ops_inventory_movement_type" AS ENUM('ADDITION', 'ADJUSTMENT', 'REMOVAL', 'RETURN', 'SALE', 'DAMAGE');--> statement-breakpoint
CREATE TABLE "ops_inventory_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"item_name" varchar(255) NOT NULL,
	"category" varchar(150) NOT NULL,
	"vendor" varchar(200),
	"model_number" varchar(100),
	"serial_number" varchar(150),
	"purchase_source" varchar(255),
	"stock_quantity" integer DEFAULT 1 NOT NULL,
	"sold_quantity" integer DEFAULT 0 NOT NULL,
	"damaged_quantity" integer DEFAULT 0 NOT NULL,
	"purchase_price" numeric(18, 2) DEFAULT '0.00' NOT NULL,
	"mrp_price" numeric(18, 2) DEFAULT '0.00' NOT NULL,
	"status" "ops_inventory_asset_status" DEFAULT 'IN_STOCK' NOT NULL,
	"client_name" varchar(255),
	"delivery_date" timestamp with time zone,
	"notes" text,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "ops_inventory_assets_quantities_nonnegative" CHECK ("stock_quantity" >= 0 AND "sold_quantity" >= 0 AND "damaged_quantity" >= 0),
	CONSTRAINT "ops_inventory_assets_prices_nonnegative" CHECK ("purchase_price" >= 0 AND "mrp_price" >= 0)
);
--> statement-breakpoint
CREATE TABLE "ops_inventory_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"type" "ops_inventory_movement_type" NOT NULL,
	"quantity_delta" integer NOT NULL,
	"stock_quantity_after" integer NOT NULL,
	"remarks" text,
	"performed_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ops_inventory_movements_stock_nonnegative" CHECK ("stock_quantity_after" >= 0)
);
--> statement-breakpoint
ALTER TABLE "ops_inventory_assets" ADD CONSTRAINT "ops_inventory_assets_tenant_id_organizations_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ops_inventory_assets" ADD CONSTRAINT "ops_inventory_assets_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ops_inventory_assets" ADD CONSTRAINT "ops_inventory_assets_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ops_inventory_movements" ADD CONSTRAINT "ops_inventory_movements_tenant_id_organizations_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ops_inventory_movements" ADD CONSTRAINT "ops_inventory_movements_asset_id_ops_inventory_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."ops_inventory_assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ops_inventory_movements" ADD CONSTRAINT "ops_inventory_movements_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ops_inventory_assets_tenant_idx" ON "ops_inventory_assets" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "ops_inventory_assets_tenant_status_idx" ON "ops_inventory_assets" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "ops_inventory_assets_tenant_vendor_idx" ON "ops_inventory_assets" USING btree ("tenant_id","vendor");--> statement-breakpoint
CREATE INDEX "ops_inventory_assets_tenant_item_idx" ON "ops_inventory_assets" USING btree ("tenant_id","item_name");--> statement-breakpoint
CREATE INDEX "ops_inventory_assets_tenant_serial_idx" ON "ops_inventory_assets" USING btree ("tenant_id","serial_number");--> statement-breakpoint
CREATE UNIQUE INDEX "ops_inventory_assets_tenant_serial_unique" ON "ops_inventory_assets" USING btree ("tenant_id", lower("serial_number")) WHERE "serial_number" IS NOT NULL AND "deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "ops_inventory_movements_tenant_idx" ON "ops_inventory_movements" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "ops_inventory_movements_asset_idx" ON "ops_inventory_movements" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "ops_inventory_movements_tenant_created_at_idx" ON "ops_inventory_movements" USING btree ("tenant_id","created_at");--> statement-breakpoint
ALTER TABLE "ops_inventory_assets" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ops_inventory_assets" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "ops_inventory_assets_tenant_isolation" ON "ops_inventory_assets" USING ("tenant_id" = "app"."current_tenant_id"()) WITH CHECK ("tenant_id" = "app"."current_tenant_id"());--> statement-breakpoint
ALTER TABLE "ops_inventory_movements" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ops_inventory_movements" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "ops_inventory_movements_tenant_isolation" ON "ops_inventory_movements" USING ("tenant_id" = "app"."current_tenant_id"()) WITH CHECK ("tenant_id" = "app"."current_tenant_id"());
--> statement-breakpoint
INSERT INTO "platform_permissions" ("code", "description") VALUES
  ('operations.inventory.access', 'View company inventory and stock movements'),
  ('operations.inventory.manage', 'Create, update, import, and archive company inventory')
ON CONFLICT ("code") DO NOTHING;
--> statement-breakpoint
ALTER TABLE "platform_role_permissions" NO FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
INSERT INTO "platform_role_permissions" ("organization_id", "role", "permission_id")
SELECT organizations.id, assignments.role, permissions.id
FROM "organizations" AS organizations
CROSS JOIN (VALUES
  ('OWNER'::"user_role", 'operations.inventory.access'),
  ('OWNER'::"user_role", 'operations.inventory.manage'),
  ('SUPER_ADMIN'::"user_role", 'operations.inventory.access'),
  ('SUPER_ADMIN'::"user_role", 'operations.inventory.manage'),
  ('ADMIN'::"user_role", 'operations.inventory.access'),
  ('ADMIN'::"user_role", 'operations.inventory.manage'),
  ('OPERATIONS'::"user_role", 'operations.inventory.access'),
  ('OPERATIONS'::"user_role", 'operations.inventory.manage'),
  ('MANAGEMENT'::"user_role", 'operations.inventory.access'),
  ('HEAD'::"user_role", 'operations.inventory.access'),
  ('HEAD'::"user_role", 'operations.inventory.manage'),
  ('MANAGER'::"user_role", 'operations.inventory.access'),
  ('MANAGER'::"user_role", 'operations.inventory.manage'),
  ('STAFF'::"user_role", 'operations.inventory.access')
) AS assignments(role, permission_code)
INNER JOIN "platform_permissions" AS permissions ON permissions.code = assignments.permission_code
ON CONFLICT DO NOTHING;
--> statement-breakpoint
ALTER TABLE "platform_role_permissions" FORCE ROW LEVEL SECURITY;
