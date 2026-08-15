CREATE TYPE "public"."ops_purchase_order_status" AS ENUM('DRAFT', 'ISSUED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "ops_purchase_orders" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "po_number" varchar(40) NOT NULL,
  "vendor_id" uuid NOT NULL,
  "po_date" date NOT NULL,
  "attention_contact" varchar(200),
  "delivery_address" text,
  "payment_terms" varchar(500),
  "notes" text,
  "status" "ops_purchase_order_status" DEFAULT 'ISSUED' NOT NULL,
  "total_amount" numeric(18,2) DEFAULT '0.00' NOT NULL,
  "created_by" uuid,
  "updated_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);--> statement-breakpoint
CREATE TABLE "ops_purchase_order_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "purchase_order_id" uuid NOT NULL,
  "product_id" uuid,
  "product_name" varchar(255) NOT NULL,
  "description" text,
  "unit_symbol" varchar(30) NOT NULL,
  "quantity" integer NOT NULL,
  "unit_price" numeric(18,2) DEFAULT '0.00' NOT NULL,
  "line_total" numeric(18,2) DEFAULT '0.00' NOT NULL,
  "received_quantity" integer DEFAULT 0 NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "ops_po_items_quantities_nonnegative" CHECK ("quantity" > 0 AND "received_quantity" >= 0 AND "received_quantity" <= "quantity"),
  CONSTRAINT "ops_po_items_values_nonnegative" CHECK ("unit_price" >= 0 AND "line_total" >= 0)
);--> statement-breakpoint
ALTER TABLE "ops_purchase_orders" ADD CONSTRAINT "ops_purchase_orders_tenant_id_organizations_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE cascade;--> statement-breakpoint
ALTER TABLE "ops_purchase_orders" ADD CONSTRAINT "ops_purchase_orders_vendor_id_ops_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "ops_vendors"("id") ON DELETE restrict;--> statement-breakpoint
ALTER TABLE "ops_purchase_orders" ADD CONSTRAINT "ops_purchase_orders_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE set null;--> statement-breakpoint
ALTER TABLE "ops_purchase_orders" ADD CONSTRAINT "ops_purchase_orders_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE set null;--> statement-breakpoint
ALTER TABLE "ops_purchase_order_items" ADD CONSTRAINT "ops_purchase_order_items_tenant_id_organizations_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE cascade;--> statement-breakpoint
ALTER TABLE "ops_purchase_order_items" ADD CONSTRAINT "ops_purchase_order_items_purchase_order_id_ops_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "ops_purchase_orders"("id") ON DELETE cascade;--> statement-breakpoint
ALTER TABLE "ops_purchase_order_items" ADD CONSTRAINT "ops_purchase_order_items_product_id_ops_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "ops_products"("id") ON DELETE set null;--> statement-breakpoint
CREATE UNIQUE INDEX "ops_purchase_orders_tenant_number_unique" ON "ops_purchase_orders" ("tenant_id", "po_number") WHERE "deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "ops_purchase_orders_tenant_date_idx" ON "ops_purchase_orders" ("tenant_id", "po_date");--> statement-breakpoint
CREATE INDEX "ops_purchase_orders_tenant_vendor_idx" ON "ops_purchase_orders" ("tenant_id", "vendor_id");--> statement-breakpoint
CREATE INDEX "ops_po_items_order_idx" ON "ops_purchase_order_items" ("purchase_order_id");--> statement-breakpoint
CREATE INDEX "ops_po_items_tenant_idx" ON "ops_purchase_order_items" ("tenant_id");--> statement-breakpoint
ALTER TABLE "ops_purchase_orders" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ops_purchase_orders" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "ops_purchase_orders_tenant_isolation" ON "ops_purchase_orders" USING ("tenant_id" = "app"."current_tenant_id"()) WITH CHECK ("tenant_id" = "app"."current_tenant_id"());--> statement-breakpoint
ALTER TABLE "ops_purchase_order_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ops_purchase_order_items" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "ops_purchase_order_items_tenant_isolation" ON "ops_purchase_order_items" USING ("tenant_id" = "app"."current_tenant_id"()) WITH CHECK ("tenant_id" = "app"."current_tenant_id"());
