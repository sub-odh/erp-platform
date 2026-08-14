ALTER TABLE "users" ADD COLUMN "phone" varchar(50);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "date_of_birth" date;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "father_name" varchar(200);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "mother_name" varchar(200);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "citizenship_number" varchar(100);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "pan_number" varchar(100);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "permanent_address" varchar(500);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "signature_url" varchar(1000);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "signature_file_name" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "signature_mime_type" varchar(100);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "signature_size" integer;
