ALTER TABLE "ops_delivery_orders" ADD COLUMN "balance_voided" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "ops_delivery_orders" ADD COLUMN "recovery_notice_day" integer;
