CREATE TABLE "sales_customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"customer_code" varchar(50) NOT NULL,
	"name" varchar(200) NOT NULL,
	"legal_name" varchar(200),
	"tax_number" varchar(100),
	"email" varchar(320),
	"phone" varchar(50),
	"website" varchar(500),
	"billing_address_line_1" varchar(255),
	"billing_address_line_2" varchar(255),
	"billing_city" varchar(100),
	"billing_state" varchar(100),
	"billing_postal_code" varchar(30),
	"billing_country" varchar(100),
	"shipping_address_line_1" varchar(255),
	"shipping_address_line_2" varchar(255),
	"shipping_city" varchar(100),
	"shipping_state" varchar(100),
	"shipping_postal_code" varchar(30),
	"shipping_country" varchar(100),
	"credit_limit" numeric(18, 2) DEFAULT '0.00' NOT NULL,
	"payment_terms_days" numeric(5, 0) DEFAULT '0' NOT NULL,
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sales_customer_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"job_title" varchar(150),
	"email" varchar(320),
	"phone" varchar(50),
	"mobile" varchar(50),
	"is_primary" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "sales_customers" ADD CONSTRAINT "sales_customers_tenant_id_organizations_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_customers" ADD CONSTRAINT "sales_customers_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_customers" ADD CONSTRAINT "sales_customers_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_customer_contacts" ADD CONSTRAINT "sales_customer_contacts_tenant_id_organizations_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_customer_contacts" ADD CONSTRAINT "sales_customer_contacts_customer_id_sales_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."sales_customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_customer_contacts" ADD CONSTRAINT "sales_customer_contacts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_customer_contacts" ADD CONSTRAINT "sales_customer_contacts_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "sales_customers_tenant_code_unique" ON "sales_customers" USING btree ("tenant_id","customer_code");--> statement-breakpoint
CREATE INDEX "sales_customers_tenant_idx" ON "sales_customers" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "sales_customers_tenant_active_idx" ON "sales_customers" USING btree ("tenant_id","is_active");--> statement-breakpoint
CREATE INDEX "sales_customers_tenant_name_idx" ON "sales_customers" USING btree ("tenant_id","name");--> statement-breakpoint
CREATE INDEX "sales_customer_contacts_customer_idx" ON "sales_customer_contacts" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "sales_customer_contacts_tenant_idx" ON "sales_customer_contacts" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "sales_customer_contacts_tenant_customer_idx" ON "sales_customer_contacts" USING btree ("tenant_id","customer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sales_customer_contacts_primary_unique" ON "sales_customer_contacts" USING btree ("tenant_id","customer_id") WHERE "sales_customer_contacts"."is_primary" = true;
