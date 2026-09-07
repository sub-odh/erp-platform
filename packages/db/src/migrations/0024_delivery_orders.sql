CREATE TABLE "ops_delivery_orders" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "delivery_number" varchar(40) NOT NULL,
  "delivery_date" date NOT NULL,
  "customer_name" varchar(255) NOT NULL,
  "contact_name" varchar(255),
  "contact_phone" varchar(80),
  "delivery_address" text,
  "notes" text,
  "delivered_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "ops_delivery_order_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "delivery_order_id" uuid NOT NULL,
  "asset_id" uuid NOT NULL,
  "item_name" varchar(255) NOT NULL,
  "serial_number" varchar(150),
  "quantity" integer NOT NULL,
  "unit_price" numeric(18, 2) DEFAULT '0.00' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "ops_delivery_order_items_quantity_positive" CHECK ("quantity" > 0)
);--> statement-breakpoint
ALTER TABLE "ops_delivery_orders" ADD CONSTRAINT "ops_delivery_orders_tenant_id_organizations_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE cascade;--> statement-breakpoint
ALTER TABLE "ops_delivery_orders" ADD CONSTRAINT "ops_delivery_orders_delivered_by_users_id_fk" FOREIGN KEY ("delivered_by") REFERENCES "users"("id") ON DELETE set null;--> statement-breakpoint
ALTER TABLE "ops_delivery_order_items" ADD CONSTRAINT "ops_delivery_order_items_tenant_id_organizations_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE cascade;--> statement-breakpoint
ALTER TABLE "ops_delivery_order_items" ADD CONSTRAINT "ops_delivery_order_items_delivery_order_id_ops_delivery_orders_id_fk" FOREIGN KEY ("delivery_order_id") REFERENCES "ops_delivery_orders"("id") ON DELETE cascade;--> statement-breakpoint
ALTER TABLE "ops_delivery_order_items" ADD CONSTRAINT "ops_delivery_order_items_asset_id_ops_inventory_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "ops_inventory_assets"("id") ON DELETE restrict;--> statement-breakpoint
CREATE UNIQUE INDEX "ops_delivery_orders_tenant_number_unique" ON "ops_delivery_orders" ("tenant_id", "delivery_number");--> statement-breakpoint
CREATE INDEX "ops_delivery_orders_tenant_date_idx" ON "ops_delivery_orders" ("tenant_id", "delivery_date");--> statement-breakpoint
CREATE UNIQUE INDEX "ops_delivery_order_items_delivery_asset_unique" ON "ops_delivery_order_items" ("delivery_order_id", "asset_id");--> statement-breakpoint
CREATE INDEX "ops_delivery_order_items_tenant_delivery_idx" ON "ops_delivery_order_items" ("tenant_id", "delivery_order_id");--> statement-breakpoint
ALTER TABLE "ops_delivery_orders" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ops_delivery_orders" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "ops_delivery_orders_tenant_isolation" ON "ops_delivery_orders" USING ("tenant_id" = "app"."current_tenant_id"()) WITH CHECK ("tenant_id" = "app"."current_tenant_id"());--> statement-breakpoint
ALTER TABLE "ops_delivery_order_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ops_delivery_order_items" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "ops_delivery_order_items_tenant_isolation" ON "ops_delivery_order_items" USING ("tenant_id" = "app"."current_tenant_id"()) WITH CHECK ("tenant_id" = "app"."current_tenant_id"());
