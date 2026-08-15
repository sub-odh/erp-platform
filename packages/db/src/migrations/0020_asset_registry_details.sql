ALTER TYPE "ops_inventory_asset_status" ADD VALUE IF NOT EXISTS 'AVAILABLE';
ALTER TYPE "ops_inventory_asset_status" ADD VALUE IF NOT EXISTS 'IN_USE';
ALTER TYPE "ops_inventory_asset_status" ADD VALUE IF NOT EXISTS 'POC_LOAN';

ALTER TABLE "ops_inventory_assets"
  ADD COLUMN "purchase_date" date,
  ADD COLUMN "location" varchar(255),
  ADD COLUMN "assigned_user_name" varchar(255),
  ADD COLUMN "assigned_user_contact" varchar(255),
  ADD COLUMN "assigned_date" date,
  ADD COLUMN "purpose" text;
