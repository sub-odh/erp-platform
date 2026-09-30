ALTER TABLE "sales_leads"
  ADD COLUMN "project_title" varchar(255),
  ADD COLUMN "contact_person" varchar(255),
  ADD COLUMN "stage" varchar(40) DEFAULT 'Discovery' NOT NULL,
  ADD COLUMN "deal_value" numeric(18, 2) DEFAULT '0.00' NOT NULL,
  ADD COLUMN "winning_probability" integer DEFAULT 0 NOT NULL,
  ADD COLUMN "expected_closing" date,
  ADD COLUMN "deal_remarks" text,
  ADD COLUMN "customer_id" uuid,
  ADD COLUMN "assigned_employee_id" uuid;
--> statement-breakpoint
ALTER TABLE "sales_leads" ADD CONSTRAINT "sales_leads_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "sales_customers"("id") ON DELETE set null;
--> statement-breakpoint
ALTER TABLE "sales_leads" ADD CONSTRAINT "sales_leads_assigned_employee_id_fk" FOREIGN KEY ("assigned_employee_id") REFERENCES "hr_employees"("id") ON DELETE set null;
--> statement-breakpoint
ALTER TABLE "sales_quotations" ADD COLUMN "is_final" integer DEFAULT 0 NOT NULL;
