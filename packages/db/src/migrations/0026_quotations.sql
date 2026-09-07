CREATE TYPE "sales_quotation_status" AS ENUM ('ACTIVE', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "sales_quotations" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,"tenant_id" uuid NOT NULL,"quotation_number" varchar(40) NOT NULL,"customer_id" uuid NOT NULL,"issue_date" date NOT NULL,"expiry_date" date NOT NULL,"destination_address" text,"terms" text,"status" "sales_quotation_status" DEFAULT 'ACTIVE' NOT NULL,"subtotal_amount" numeric(18, 2) DEFAULT '0.00' NOT NULL,"vat_amount" numeric(18, 2) DEFAULT '0.00' NOT NULL,"total_amount" numeric(18, 2) DEFAULT '0.00' NOT NULL,"created_by" uuid,"updated_by" uuid,"created_at" timestamp with time zone DEFAULT now() NOT NULL,"updated_at" timestamp with time zone DEFAULT now() NOT NULL,"deleted_at" timestamp with time zone);--> statement-breakpoint
CREATE TABLE "sales_quotation_items" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,"tenant_id" uuid NOT NULL,"quotation_id" uuid NOT NULL,"item_name" varchar(255) NOT NULL,"description" text,"quantity" integer NOT NULL,"unit_price" numeric(18, 2) DEFAULT '0.00' NOT NULL,"line_total" numeric(18, 2) DEFAULT '0.00' NOT NULL,"sort_order" integer DEFAULT 0 NOT NULL,"created_at" timestamp with time zone DEFAULT now() NOT NULL);--> statement-breakpoint
ALTER TABLE "sales_quotations" ADD CONSTRAINT "sales_quotations_tenant_id_organizations_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE cascade;--> statement-breakpoint
ALTER TABLE "sales_quotations" ADD CONSTRAINT "sales_quotations_customer_id_sales_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "sales_customers"("id") ON DELETE restrict;--> statement-breakpoint
ALTER TABLE "sales_quotations" ADD CONSTRAINT "sales_quotations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE set null;--> statement-breakpoint
ALTER TABLE "sales_quotations" ADD CONSTRAINT "sales_quotations_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE set null;--> statement-breakpoint
ALTER TABLE "sales_quotation_items" ADD CONSTRAINT "sales_quotation_items_tenant_id_organizations_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE cascade;--> statement-breakpoint
ALTER TABLE "sales_quotation_items" ADD CONSTRAINT "sales_quotation_items_quotation_id_sales_quotations_id_fk" FOREIGN KEY ("quotation_id") REFERENCES "sales_quotations"("id") ON DELETE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "sales_quotations_tenant_number_unique" ON "sales_quotations" ("tenant_id","quotation_number") WHERE "sales_quotations"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "sales_quotations_tenant_issue_date_idx" ON "sales_quotations" ("tenant_id","issue_date");--> statement-breakpoint
CREATE INDEX "sales_quotations_tenant_customer_idx" ON "sales_quotations" ("tenant_id","customer_id");--> statement-breakpoint
CREATE INDEX "sales_quotation_items_quotation_idx" ON "sales_quotation_items" ("quotation_id");--> statement-breakpoint
CREATE INDEX "sales_quotation_items_tenant_idx" ON "sales_quotation_items" ("tenant_id");--> statement-breakpoint
ALTER TABLE "sales_quotations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "sales_quotations" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "sales_quotations_tenant_isolation" ON "sales_quotations" USING ("tenant_id" = "app"."current_tenant_id"()) WITH CHECK ("tenant_id" = "app"."current_tenant_id"());--> statement-breakpoint
ALTER TABLE "sales_quotation_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "sales_quotation_items" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "sales_quotation_items_tenant_isolation" ON "sales_quotation_items" USING ("tenant_id" = "app"."current_tenant_id"()) WITH CHECK ("tenant_id" = "app"."current_tenant_id"());
