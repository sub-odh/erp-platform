ALTER TABLE "organizations"
  ALTER COLUMN "currency_code" SET DEFAULT 'NPR';

UPDATE "organizations"
SET "currency_code" = 'NPR'
WHERE "currency_code" IS DISTINCT FROM 'NPR';
