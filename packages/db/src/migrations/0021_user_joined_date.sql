ALTER TABLE "users"
  ADD COLUMN "joined_date" date;

UPDATE "users"
SET "joined_date" = "created_at"::date
WHERE "joined_date" IS NULL;
