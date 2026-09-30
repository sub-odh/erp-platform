ALTER TABLE "ops_delivery_orders" ADD COLUMN "customer_id" uuid;
--> statement-breakpoint
ALTER TABLE "ops_delivery_orders" ADD CONSTRAINT "ops_delivery_orders_customer_id_sales_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "sales_customers"("id") ON DELETE set null;
