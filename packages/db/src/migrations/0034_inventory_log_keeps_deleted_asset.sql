ALTER TABLE "ops_inventory_movements" DROP CONSTRAINT "ops_inventory_movements_asset_id_ops_inventory_assets_id_fk";--> statement-breakpoint
ALTER TABLE "ops_inventory_movements" ALTER COLUMN "asset_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "ops_inventory_movements" ADD CONSTRAINT "ops_inventory_movements_asset_id_ops_inventory_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."ops_inventory_assets"("id") ON DELETE set null ON UPDATE no action;
