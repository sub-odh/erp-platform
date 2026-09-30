ALTER TABLE "sales_quotations" ALTER COLUMN "customer_id" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "sales_quotations"
  ADD COLUMN "customer_name" varchar(255),
  ADD COLUMN "lead_id" uuid,
  ADD COLUMN "currency" varchar(3) DEFAULT 'NPR' NOT NULL,
  ADD COLUMN "vat_applicable" integer DEFAULT 1 NOT NULL;
--> statement-breakpoint
ALTER TABLE "sales_quotations" ADD CONSTRAINT "sales_quotations_lead_id_sales_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "sales_leads"("id") ON DELETE set null;
--> statement-breakpoint
UPDATE "sales_quotations" AS q
SET "customer_name" = c."name"
FROM "sales_customers" AS c
WHERE q."customer_id" = c."id" AND q."customer_name" IS NULL;
