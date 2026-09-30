CREATE TABLE "sales_cloud_quotations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "quotation_number" varchar(40) NOT NULL,
  "customer_name" varchar(255) NOT NULL,
  "customer_address" text,
  "issue_date" date NOT NULL,
  "expiry_date" date,
  "currency" varchar(3) DEFAULT 'NPR' NOT NULL,
  "vat_applicable" integer DEFAULT 1 NOT NULL,
  "subtotal_amount" numeric(18, 2) DEFAULT '0.00' NOT NULL,
  "discount_amount" numeric(18, 2) DEFAULT '0.00' NOT NULL,
  "vat_amount" numeric(18, 2) DEFAULT '0.00' NOT NULL,
  "total_amount" numeric(18, 2) DEFAULT '0.00' NOT NULL,
  "terms" text,
  "created_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales_cloud_quotation_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "quotation_id" uuid NOT NULL,
  "service_type" varchar(80) NOT NULL,
  "item_name" varchar(255) NOT NULL,
  "description" text,
  "quantity" integer NOT NULL,
  "unit_price" numeric(18, 2) DEFAULT '0.00' NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sales_cloud_quotations" ADD CONSTRAINT "sales_cloud_quotations_tenant_id_organizations_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "sales_cloud_quotations" ADD CONSTRAINT "sales_cloud_quotations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE set null;
--> statement-breakpoint
ALTER TABLE "sales_cloud_quotation_items" ADD CONSTRAINT "sales_cloud_quotation_items_tenant_id_organizations_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "sales_cloud_quotation_items" ADD CONSTRAINT "sales_cloud_items_quotation_id_fk" FOREIGN KEY ("quotation_id") REFERENCES "sales_cloud_quotations"("id") ON DELETE cascade;
--> statement-breakpoint
CREATE UNIQUE INDEX "sales_cloud_quotations_tenant_number_unique" ON "sales_cloud_quotations" ("tenant_id", "quotation_number");
--> statement-breakpoint
CREATE INDEX "sales_cloud_quotations_tenant_issue_date_idx" ON "sales_cloud_quotations" ("tenant_id", "issue_date");
--> statement-breakpoint
CREATE INDEX "sales_cloud_quotation_items_quotation_idx" ON "sales_cloud_quotation_items" ("quotation_id");
--> statement-breakpoint
CREATE INDEX "sales_cloud_quotation_items_tenant_idx" ON "sales_cloud_quotation_items" ("tenant_id");
--> statement-breakpoint
ALTER TABLE "sales_cloud_quotations" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "sales_cloud_quotations" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "sales_cloud_quotations_tenant_isolation" ON "sales_cloud_quotations" USING ("tenant_id" = "app"."current_tenant_id"()) WITH CHECK ("tenant_id" = "app"."current_tenant_id"());
--> statement-breakpoint
ALTER TABLE "sales_cloud_quotation_items" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "sales_cloud_quotation_items" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "sales_cloud_quotation_items_tenant_isolation" ON "sales_cloud_quotation_items" USING ("tenant_id" = "app"."current_tenant_id"()) WITH CHECK ("tenant_id" = "app"."current_tenant_id"());
