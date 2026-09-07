CREATE TYPE "finance_invoice_status" AS ENUM ('UNPAID', 'PARTIAL', 'PAID', 'VOID');--> statement-breakpoint
CREATE TYPE "finance_payment_method" AS ENUM ('CASH', 'BANK', 'CHEQUE', 'ONLINE', 'OTHER');--> statement-breakpoint
CREATE TABLE "finance_invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"invoice_number" varchar(40) NOT NULL,
	"delivery_order_id" uuid NOT NULL,
	"customer_name" varchar(255) NOT NULL,
	"invoice_date" date NOT NULL,
	"subtotal_amount" numeric(18, 2) DEFAULT '0.00' NOT NULL,
	"vat_amount" numeric(18, 2) DEFAULT '0.00' NOT NULL,
	"total_amount" numeric(18, 2) DEFAULT '0.00' NOT NULL,
	"paid_amount" numeric(18, 2) DEFAULT '0.00' NOT NULL,
	"status" "finance_invoice_status" DEFAULT 'UNPAID' NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "finance_invoice_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"invoice_id" uuid NOT NULL,
	"item_name" varchar(255) NOT NULL,
	"serial_number" varchar(150),
	"quantity" integer NOT NULL,
	"unit_price" numeric(18, 2) DEFAULT '0.00' NOT NULL,
	"line_total" numeric(18, 2) DEFAULT '0.00' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "finance_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"invoice_id" uuid NOT NULL,
	"amount" numeric(18, 2) NOT NULL,
	"method" "finance_payment_method" NOT NULL,
	"reference_number" varchar(120),
	"remarks" text,
	"paid_at" timestamp with time zone DEFAULT now() NOT NULL,
	"recorded_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "finance_invoices" ADD CONSTRAINT "finance_invoices_tenant_id_organizations_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE cascade;--> statement-breakpoint
ALTER TABLE "finance_invoices" ADD CONSTRAINT "finance_invoices_delivery_order_id_ops_delivery_orders_id_fk" FOREIGN KEY ("delivery_order_id") REFERENCES "ops_delivery_orders"("id") ON DELETE restrict;--> statement-breakpoint
ALTER TABLE "finance_invoices" ADD CONSTRAINT "finance_invoices_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE set null;--> statement-breakpoint
ALTER TABLE "finance_invoice_items" ADD CONSTRAINT "finance_invoice_items_tenant_id_organizations_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE cascade;--> statement-breakpoint
ALTER TABLE "finance_invoice_items" ADD CONSTRAINT "finance_invoice_items_invoice_id_finance_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "finance_invoices"("id") ON DELETE cascade;--> statement-breakpoint
ALTER TABLE "finance_payments" ADD CONSTRAINT "finance_payments_tenant_id_organizations_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE cascade;--> statement-breakpoint
ALTER TABLE "finance_payments" ADD CONSTRAINT "finance_payments_invoice_id_finance_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "finance_invoices"("id") ON DELETE cascade;--> statement-breakpoint
ALTER TABLE "finance_payments" ADD CONSTRAINT "finance_payments_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "users"("id") ON DELETE set null;--> statement-breakpoint
CREATE UNIQUE INDEX "finance_invoices_tenant_number_unique" ON "finance_invoices" ("tenant_id","invoice_number");--> statement-breakpoint
CREATE UNIQUE INDEX "finance_invoices_delivery_order_unique" ON "finance_invoices" ("delivery_order_id");--> statement-breakpoint
CREATE INDEX "finance_invoices_tenant_status_idx" ON "finance_invoices" ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "finance_invoice_items_invoice_idx" ON "finance_invoice_items" ("invoice_id");--> statement-breakpoint
CREATE INDEX "finance_invoice_items_tenant_idx" ON "finance_invoice_items" ("tenant_id");--> statement-breakpoint
CREATE INDEX "finance_payments_invoice_idx" ON "finance_payments" ("invoice_id");--> statement-breakpoint
CREATE INDEX "finance_payments_tenant_idx" ON "finance_payments" ("tenant_id");--> statement-breakpoint
ALTER TABLE "finance_invoices" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "finance_invoices" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "finance_invoices_tenant_isolation" ON "finance_invoices" USING ("tenant_id" = "app"."current_tenant_id"()) WITH CHECK ("tenant_id" = "app"."current_tenant_id"());--> statement-breakpoint
ALTER TABLE "finance_invoice_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "finance_invoice_items" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "finance_invoice_items_tenant_isolation" ON "finance_invoice_items" USING ("tenant_id" = "app"."current_tenant_id"()) WITH CHECK ("tenant_id" = "app"."current_tenant_id"());--> statement-breakpoint
ALTER TABLE "finance_payments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "finance_payments" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "finance_payments_tenant_isolation" ON "finance_payments" USING ("tenant_id" = "app"."current_tenant_id"()) WITH CHECK ("tenant_id" = "app"."current_tenant_id"());
