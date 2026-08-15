CREATE TABLE "company_employee_roles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "name" varchar(100) NOT NULL
);

CREATE INDEX "company_employee_roles_organization_idx" ON "company_employee_roles" ("organization_id");
CREATE UNIQUE INDEX "company_employee_roles_organization_name_unique" ON "company_employee_roles" ("organization_id", "name");

ALTER TABLE "users" ADD COLUMN "employee_role" varchar(100);
