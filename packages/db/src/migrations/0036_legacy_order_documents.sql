ALTER TABLE "ops_purchase_orders" ALTER COLUMN "vendor_id" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "ops_purchase_orders"
  ADD COLUMN "sequence" integer,
  ADD COLUMN "vendor_details" text,
  ADD COLUMN "bill_to" text,
  ADD COLUMN "ship_to" text,
  ADD COLUMN "terms_conditions" text,
  ADD COLUMN "currency" varchar(3) DEFAULT 'NPR' NOT NULL;
--> statement-breakpoint
ALTER TABLE "ops_purchase_order_items" ALTER COLUMN "product_id" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "ops_purchase_order_items"
  ADD COLUMN "part_number" varchar(255) DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE "ops_delivery_orders"
  ADD COLUMN "status" varchar(32) DEFAULT 'Delivered' NOT NULL,
  ADD COLUMN "is_billable" integer DEFAULT 1 NOT NULL,
  ADD COLUMN "is_voided" integer DEFAULT 0 NOT NULL,
  ADD COLUMN "is_taxable" integer DEFAULT 1 NOT NULL,
  ADD COLUMN "return_validity_days" integer DEFAULT 365 NOT NULL,
  ADD COLUMN "source_bill_no" varchar(120),
  ADD COLUMN "discount_value" numeric(18, 2) DEFAULT '0.00' NOT NULL,
  ADD COLUMN "discount_type" varchar(16) DEFAULT 'percent' NOT NULL,
  ADD COLUMN "subtotal_amount" numeric(18, 2) DEFAULT '0.00' NOT NULL,
  ADD COLUMN "vat_amount" numeric(18, 2) DEFAULT '0.00' NOT NULL,
  ADD COLUMN "grand_total" numeric(18, 2) DEFAULT '0.00' NOT NULL,
  ADD COLUMN "sold_by_id" uuid,
  ADD COLUMN "lead_id" uuid,
  ADD COLUMN "created_by" uuid;
--> statement-breakpoint
ALTER TABLE "ops_delivery_orders" ADD CONSTRAINT "ops_delivery_orders_sold_by_id_hr_employees_id_fk" FOREIGN KEY ("sold_by_id") REFERENCES "hr_employees"("id") ON DELETE set null;
--> statement-breakpoint
ALTER TABLE "ops_delivery_orders" ADD CONSTRAINT "ops_delivery_orders_lead_id_sales_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "sales_leads"("id") ON DELETE set null;
--> statement-breakpoint
ALTER TABLE "ops_delivery_orders" ADD CONSTRAINT "ops_delivery_orders_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE set null;
--> statement-breakpoint
ALTER TABLE "ops_delivery_order_items" ALTER COLUMN "asset_id" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "ops_delivery_order_items"
  ADD COLUMN "service_name" varchar(255),
  ADD COLUMN "line_total" numeric(18, 2) DEFAULT '0.00' NOT NULL;
