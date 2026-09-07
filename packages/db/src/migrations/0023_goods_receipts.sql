CREATE TABLE "ops_goods_receipts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "receipt_number" varchar(40) NOT NULL,
  "purchase_order_id" uuid NOT NULL,
  "received_date" date NOT NULL,
  "delivery_note" varchar(120),
  "notes" text,
  "received_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "ops_goods_receipt_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "goods_receipt_id" uuid NOT NULL,
  "purchase_order_item_id" uuid NOT NULL,
  "product_id" uuid,
  "product_name" varchar(255) NOT NULL,
  "quantity" integer NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "ops_goods_receipt_items_quantity_positive" CHECK ("quantity" > 0)
);--> statement-breakpoint
ALTER TABLE "ops_goods_receipts" ADD CONSTRAINT "ops_goods_receipts_tenant_id_organizations_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE cascade;--> statement-breakpoint
ALTER TABLE "ops_goods_receipts" ADD CONSTRAINT "ops_goods_receipts_purchase_order_id_ops_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "ops_purchase_orders"("id") ON DELETE restrict;--> statement-breakpoint
ALTER TABLE "ops_goods_receipts" ADD CONSTRAINT "ops_goods_receipts_received_by_users_id_fk" FOREIGN KEY ("received_by") REFERENCES "users"("id") ON DELETE set null;--> statement-breakpoint
ALTER TABLE "ops_goods_receipt_items" ADD CONSTRAINT "ops_goods_receipt_items_tenant_id_organizations_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE cascade;--> statement-breakpoint
ALTER TABLE "ops_goods_receipt_items" ADD CONSTRAINT "ops_goods_receipt_items_goods_receipt_id_ops_goods_receipts_id_fk" FOREIGN KEY ("goods_receipt_id") REFERENCES "ops_goods_receipts"("id") ON DELETE cascade;--> statement-breakpoint
ALTER TABLE "ops_goods_receipt_items" ADD CONSTRAINT "ops_goods_receipt_items_purchase_order_item_id_ops_purchase_order_items_id_fk" FOREIGN KEY ("purchase_order_item_id") REFERENCES "ops_purchase_order_items"("id") ON DELETE restrict;--> statement-breakpoint
ALTER TABLE "ops_goods_receipt_items" ADD CONSTRAINT "ops_goods_receipt_items_product_id_ops_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "ops_products"("id") ON DELETE set null;--> statement-breakpoint
CREATE UNIQUE INDEX "ops_goods_receipts_tenant_number_unique" ON "ops_goods_receipts" ("tenant_id", "receipt_number");--> statement-breakpoint
CREATE INDEX "ops_goods_receipts_tenant_po_idx" ON "ops_goods_receipts" ("tenant_id", "purchase_order_id");--> statement-breakpoint
CREATE INDEX "ops_goods_receipts_tenant_date_idx" ON "ops_goods_receipts" ("tenant_id", "received_date");--> statement-breakpoint
CREATE UNIQUE INDEX "ops_goods_receipt_items_receipt_po_item_unique" ON "ops_goods_receipt_items" ("goods_receipt_id", "purchase_order_item_id");--> statement-breakpoint
CREATE INDEX "ops_goods_receipt_items_tenant_receipt_idx" ON "ops_goods_receipt_items" ("tenant_id", "goods_receipt_id");--> statement-breakpoint
ALTER TABLE "ops_goods_receipts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ops_goods_receipts" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "ops_goods_receipts_tenant_isolation" ON "ops_goods_receipts" USING ("tenant_id" = "app"."current_tenant_id"()) WITH CHECK ("tenant_id" = "app"."current_tenant_id"());--> statement-breakpoint
ALTER TABLE "ops_goods_receipt_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ops_goods_receipt_items" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "ops_goods_receipt_items_tenant_isolation" ON "ops_goods_receipt_items" USING ("tenant_id" = "app"."current_tenant_id"()) WITH CHECK ("tenant_id" = "app"."current_tenant_id"());
