CREATE TABLE "ops_item_returns" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,"tenant_id" uuid NOT NULL,"return_number" varchar(40) NOT NULL,"asset_id" uuid NOT NULL,"return_date" date NOT NULL,"customer_name" varchar(255),"quantity" integer NOT NULL,"reason" varchar(255),"notes" text,"received_by" uuid,"created_at" timestamp with time zone DEFAULT now() NOT NULL,CONSTRAINT "ops_item_returns_quantity_positive" CHECK ("quantity" > 0));--> statement-breakpoint
ALTER TABLE "ops_item_returns" ADD CONSTRAINT "ops_item_returns_tenant_id_organizations_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE cascade;--> statement-breakpoint
ALTER TABLE "ops_item_returns" ADD CONSTRAINT "ops_item_returns_asset_id_ops_inventory_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "ops_inventory_assets"("id") ON DELETE restrict;--> statement-breakpoint
ALTER TABLE "ops_item_returns" ADD CONSTRAINT "ops_item_returns_received_by_users_id_fk" FOREIGN KEY ("received_by") REFERENCES "users"("id") ON DELETE set null;--> statement-breakpoint
CREATE UNIQUE INDEX "ops_item_returns_tenant_number_unique" ON "ops_item_returns" ("tenant_id","return_number");--> statement-breakpoint
CREATE INDEX "ops_item_returns_tenant_date_idx" ON "ops_item_returns" ("tenant_id","return_date");--> statement-breakpoint
ALTER TABLE "ops_item_returns" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ops_item_returns" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "ops_item_returns_tenant_isolation" ON "ops_item_returns" USING ("tenant_id" = "app"."current_tenant_id"()) WITH CHECK ("tenant_id" = "app"."current_tenant_id"());
