CREATE TABLE "sales_proforma_invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"sequence" integer NOT NULL,
	"pi_number" varchar(40) NOT NULL,
	"pi_date" date NOT NULL,
	"customer_details" text NOT NULL,
	"bill_to" text NOT NULL,
	"ship_to" text NOT NULL,
	"terms_conditions" text,
	"total_amount" numeric(18, 2) DEFAULT '0.00' NOT NULL,
	"currency" varchar(3) DEFAULT 'NPR' NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales_proforma_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"proforma_invoice_id" uuid NOT NULL,
	"item_name" varchar(255) DEFAULT '' NOT NULL,
	"part_number" varchar(255) DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" numeric(18, 2) DEFAULT '0.00' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sales_proforma_invoices" ADD CONSTRAINT "sales_proforma_invoices_tenant_id_organizations_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "sales_proforma_invoices" ADD CONSTRAINT "sales_proforma_invoices_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE set null;
--> statement-breakpoint
ALTER TABLE "sales_proforma_items" ADD CONSTRAINT "sales_proforma_items_tenant_id_organizations_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "sales_proforma_items" ADD CONSTRAINT "sales_proforma_items_proforma_invoice_id_fk" FOREIGN KEY ("proforma_invoice_id") REFERENCES "sales_proforma_invoices"("id") ON DELETE cascade;
--> statement-breakpoint
CREATE UNIQUE INDEX "sales_proforma_invoices_tenant_number_unique" ON "sales_proforma_invoices" ("tenant_id","pi_number");
--> statement-breakpoint
CREATE INDEX "sales_proforma_invoices_tenant_date_idx" ON "sales_proforma_invoices" ("tenant_id","pi_date");
--> statement-breakpoint
CREATE INDEX "sales_proforma_items_invoice_idx" ON "sales_proforma_items" ("proforma_invoice_id");
--> statement-breakpoint
CREATE INDEX "sales_proforma_items_tenant_idx" ON "sales_proforma_items" ("tenant_id");
--> statement-breakpoint
ALTER TABLE "sales_proforma_invoices" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "sales_proforma_invoices" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "sales_proforma_invoices_tenant_isolation" ON "sales_proforma_invoices" USING ("tenant_id" = "app"."current_tenant_id"()) WITH CHECK ("tenant_id" = "app"."current_tenant_id"());
--> statement-breakpoint
ALTER TABLE "sales_proforma_items" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "sales_proforma_items" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "sales_proforma_items_tenant_isolation" ON "sales_proforma_items" USING ("tenant_id" = "app"."current_tenant_id"()) WITH CHECK ("tenant_id" = "app"."current_tenant_id"());
