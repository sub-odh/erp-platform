ALTER TABLE "organizations" ADD COLUMN "legal_name" varchar(250);--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "registration_number" varchar(100);--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "tax_number" varchar(100);--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "email" varchar(320);--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "phone" varchar(50);--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "website" varchar(500);--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "address_line_1" varchar(250);--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "address_line_2" varchar(250);--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "city" varchar(100);--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "state" varchar(100);--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "postal_code" varchar(30);--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "country" varchar(100);--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "currency_code" varchar(3) DEFAULT 'USD' NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "timezone" varchar(100) DEFAULT 'UTC' NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "logo_url" varchar(1000);