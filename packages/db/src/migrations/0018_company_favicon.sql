ALTER TABLE "organizations"
  ADD COLUMN "favicon_url" varchar(1000),
  ADD COLUMN "favicon_file_name" varchar(255),
  ADD COLUMN "favicon_mime_type" varchar(100),
  ADD COLUMN "favicon_size" integer;
