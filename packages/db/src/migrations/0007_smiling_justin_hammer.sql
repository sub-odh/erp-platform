ALTER TABLE "organizations" ADD COLUMN "logo_file_name" varchar(255);--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "logo_mime_type" varchar(100);--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "logo_size" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "avatar_url" varchar(1000);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "avatar_file_name" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "avatar_mime_type" varchar(100);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "avatar_size" integer;