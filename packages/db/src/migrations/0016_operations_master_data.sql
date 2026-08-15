CREATE TABLE "ops_categories" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "code" varchar(50) NOT NULL,
  "name" varchar(150) NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_by" uuid,
  "updated_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "ops_units" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "name" varchar(100) NOT NULL,
  "symbol" varchar(30) NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_by" uuid,
  "updated_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "ops_vendors" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "code" varchar(50) NOT NULL,
  "name" varchar(200) NOT NULL,
  "contact_person" varchar(200),
  "email" varchar(320),
  "phone" varchar(50),
  "tax_number" varchar(100),
  "address" text,
  "payment_terms_days" integer DEFAULT 0 NOT NULL,
  "notes" text,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_by" uuid,
  "updated_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone,
  CONSTRAINT "ops_vendors_payment_terms_nonnegative" CHECK ("payment_terms_days" >= 0)
);
--> statement-breakpoint
CREATE TABLE "ops_products" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "sku" varchar(80) NOT NULL,
  "name" varchar(255) NOT NULL,
  "category_id" uuid NOT NULL,
  "unit_id" uuid NOT NULL,
  "default_vendor_id" uuid,
  "description" text,
  "purchase_price" numeric(18,2) DEFAULT '0.00' NOT NULL,
  "selling_price" numeric(18,2) DEFAULT '0.00' NOT NULL,
  "reorder_level" integer DEFAULT 0 NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_by" uuid,
  "updated_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone,
  CONSTRAINT "ops_products_values_nonnegative" CHECK ("purchase_price" >= 0 AND "selling_price" >= 0 AND "reorder_level" >= 0)
);
--> statement-breakpoint
ALTER TABLE "ops_categories" ADD CONSTRAINT "ops_categories_tenant_id_organizations_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE cascade;--> statement-breakpoint
ALTER TABLE "ops_categories" ADD CONSTRAINT "ops_categories_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE set null;--> statement-breakpoint
ALTER TABLE "ops_categories" ADD CONSTRAINT "ops_categories_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE set null;--> statement-breakpoint
ALTER TABLE "ops_units" ADD CONSTRAINT "ops_units_tenant_id_organizations_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE cascade;--> statement-breakpoint
ALTER TABLE "ops_units" ADD CONSTRAINT "ops_units_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE set null;--> statement-breakpoint
ALTER TABLE "ops_units" ADD CONSTRAINT "ops_units_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE set null;--> statement-breakpoint
ALTER TABLE "ops_vendors" ADD CONSTRAINT "ops_vendors_tenant_id_organizations_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE cascade;--> statement-breakpoint
ALTER TABLE "ops_vendors" ADD CONSTRAINT "ops_vendors_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE set null;--> statement-breakpoint
ALTER TABLE "ops_vendors" ADD CONSTRAINT "ops_vendors_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE set null;--> statement-breakpoint
ALTER TABLE "ops_products" ADD CONSTRAINT "ops_products_tenant_id_organizations_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE cascade;--> statement-breakpoint
ALTER TABLE "ops_products" ADD CONSTRAINT "ops_products_category_id_ops_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "ops_categories"("id") ON DELETE restrict;--> statement-breakpoint
ALTER TABLE "ops_products" ADD CONSTRAINT "ops_products_unit_id_ops_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "ops_units"("id") ON DELETE restrict;--> statement-breakpoint
ALTER TABLE "ops_products" ADD CONSTRAINT "ops_products_default_vendor_id_ops_vendors_id_fk" FOREIGN KEY ("default_vendor_id") REFERENCES "ops_vendors"("id") ON DELETE set null;--> statement-breakpoint
ALTER TABLE "ops_products" ADD CONSTRAINT "ops_products_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE set null;--> statement-breakpoint
ALTER TABLE "ops_products" ADD CONSTRAINT "ops_products_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE set null;--> statement-breakpoint
CREATE UNIQUE INDEX "ops_categories_tenant_code_unique" ON "ops_categories" ("tenant_id", "code") WHERE "deleted_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "ops_categories_tenant_name_unique" ON "ops_categories" ("tenant_id", "name") WHERE "deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "ops_categories_tenant_idx" ON "ops_categories" ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ops_units_tenant_name_unique" ON "ops_units" ("tenant_id", "name") WHERE "deleted_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "ops_units_tenant_symbol_unique" ON "ops_units" ("tenant_id", "symbol") WHERE "deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "ops_units_tenant_idx" ON "ops_units" ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ops_vendors_tenant_code_unique" ON "ops_vendors" ("tenant_id", "code") WHERE "deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "ops_vendors_tenant_name_idx" ON "ops_vendors" ("tenant_id", "name");--> statement-breakpoint
CREATE INDEX "ops_vendors_tenant_active_idx" ON "ops_vendors" ("tenant_id", "is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "ops_products_tenant_sku_unique" ON "ops_products" ("tenant_id", "sku") WHERE "deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "ops_products_tenant_name_idx" ON "ops_products" ("tenant_id", "name");--> statement-breakpoint
CREATE INDEX "ops_products_tenant_category_idx" ON "ops_products" ("tenant_id", "category_id");--> statement-breakpoint
CREATE INDEX "ops_products_tenant_active_idx" ON "ops_products" ("tenant_id", "is_active");--> statement-breakpoint
ALTER TABLE "ops_categories" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ops_categories" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "ops_categories_tenant_isolation" ON "ops_categories" USING ("tenant_id" = "app"."current_tenant_id"()) WITH CHECK ("tenant_id" = "app"."current_tenant_id"());--> statement-breakpoint
ALTER TABLE "ops_units" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ops_units" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "ops_units_tenant_isolation" ON "ops_units" USING ("tenant_id" = "app"."current_tenant_id"()) WITH CHECK ("tenant_id" = "app"."current_tenant_id"());--> statement-breakpoint
ALTER TABLE "ops_vendors" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ops_vendors" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "ops_vendors_tenant_isolation" ON "ops_vendors" USING ("tenant_id" = "app"."current_tenant_id"()) WITH CHECK ("tenant_id" = "app"."current_tenant_id"());--> statement-breakpoint
ALTER TABLE "ops_products" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ops_products" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "ops_products_tenant_isolation" ON "ops_products" USING ("tenant_id" = "app"."current_tenant_id"()) WITH CHECK ("tenant_id" = "app"."current_tenant_id"());
