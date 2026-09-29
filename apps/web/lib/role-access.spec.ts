import assert from "node:assert/strict";

import {
  API_RULES,
  decideApi,
  decidePage,
  MENU_ROLE_ADMIN,
  PAGE_RULES,
  visibleMenu,
  visibleMenuLabels,
  type AppRole,
} from "./role-access";

const ROLES = [
  "OWNER",
  "SUPER_ADMIN",
  "ADMIN",
  "HR",
  "OPERATIONS",
  "MANAGER",
  "MANAGEMENT",
  "HEAD",
  "SALES",
  "STAFF",
  "EMPLOYEE",
] as const satisfies readonly AppRole[];

const SALES_MUST_SEE = [
  "Sales Trend",
  "Target Achievement",
  "Payments & Recovery",
  "Inventory",
  "View All Orders",
  "Create Quotation",
  "View Quotations",
  "Leads",
  "Tender Management",
  "Tender Calendar",
  "BG | PG Guarantee",
  "Company Holidays",
  "Book Meeting Hall",
  "Hierarchy",
  "Support Visit Form",
  "My Support Visits",
  "My Leaves",
  "Field Visits",
  "Expenses",
  "My TA/DA Request",
  "My Fuel Records",
];

const SALES_MUST_NOT_SEE = [
  "Purchase Orders",
  "Assets",
  "Inventory Logs",
  "Item Return",
  "Create New DO",
  "Create PI",
  "SajiloCloud Quotations",
  "Sales Leads",
  "Manage Users",
  "Company Settings",
  "SMTP Settings",
  "View Logs",
  "Employee Management",
];

for (const role of ["SALES", "STAFF"] as const) {
  const labels = visibleMenuLabels(role);
  const sections = visibleMenu(role).map((row) => row.section);

  for (const label of SALES_MUST_SEE) {
    assert.ok(labels.includes(label), `${role} menu is missing ${label}`);
  }

  for (const label of SALES_MUST_NOT_SEE) {
    assert.equal(
      labels.includes(label),
      false,
      `${role} menu must hide ${label}`,
    );
  }

  assert.equal(sections.filter((section) => section === "Sales & Logistics").length > 0, true);
  assert.equal(labels.filter((label) => label === "Inventory").length, 1);
}

assert.deepEqual(MENU_ROLE_ADMIN, ["OWNER", "SUPER_ADMIN", "ADMIN"]);

for (const role of ["OWNER", "SUPER_ADMIN", "ADMIN"] as const) {
  const rows = visibleMenu(role);
  const labels = rows.map((row) => row.label);
  assert.ok(labels.includes("Manage Users"));
  assert.ok(labels.includes("Company Settings"));
  assert.ok(labels.includes("SMTP Settings"));
  assert.ok(labels.includes("View Logs"));
  assert.equal(labels.includes("Leads"), false, role);
  assert.ok(labels.includes("Sales Leads"), role);
  assert.equal(
    rows.filter((row) => row.section === "Sales & Logistics" && row.label === "Inventory").length,
    1,
  );
}

for (const role of ["HR", "SALES", "EMPLOYEE"] as const) {
  const labels = visibleMenuLabels(role);
  assert.equal(labels.includes("Manage Users"), false, role);
  assert.equal(labels.includes("SMTP Settings"), false, role);
  assert.equal(labels.includes("View Logs"), false, role);
}

for (const role of ["MANAGEMENT", "HEAD"] as const) {
  const rows = visibleMenu(role);
  assert.equal(
    rows.filter((row) => row.label === "Inventory").length,
    2,
    role,
  );
  assert.ok(rows.some((row) => row.label === "Sales Leads"));
  assert.ok(rows.some((row) => row.label === "Leads"));
  assert.equal(rows.some((row) => row.label === "Manage Users"), false);
}

for (const role of ["OPERATIONS", "MANAGER"] as const) {
  const labels = visibleMenuLabels(role);
  assert.ok(labels.includes("Create New DO"), role);
  assert.equal(labels.includes("Leads"), false, role);
  assert.equal(labels.includes("Tender Management"), false, role);
  assert.ok(labels.includes("Tender Calendar"), role);
  assert.equal(labels.filter((label) => label === "Inventory").length, 1);
}

assert.equal(visibleMenuLabels("HR").includes("My Leaves"), false);
assert.equal(visibleMenuLabels("HR").includes("Tender Management"), false);
assert.ok(visibleMenuLabels("HR").includes("Tender Calendar"));
assert.equal(visibleMenuLabels("EMPLOYEE").includes("Inventory Master"), false);
assert.ok(visibleMenuLabels("EMPLOYEE").includes("My Leaves"));

const deniedProbes: Array<{
  role: AppRole;
  path: string;
  allowed: boolean;
}> = [
  { role: "SALES", path: "/procurement/tenders", allowed: true },
  { role: "STAFF", path: "/procurement/tender-calendar", allowed: true },
  { role: "SALES", path: "/procurement/guarantees", allowed: true },
  { role: "HR", path: "/procurement/tenders", allowed: true },
  { role: "HR", path: "/procurement/tender-calendar", allowed: false },
  { role: "EMPLOYEE", path: "/procurement/tenders", allowed: false },
  { role: "EMPLOYEE", path: "/users", allowed: false },
  { role: "ADMIN", path: "/users", allowed: true },
  { role: "ADMIN", path: "/settings/company", allowed: true },
  { role: "ADMIN", path: "/settings/smtp", allowed: true },
  { role: "OWNER", path: "/users", allowed: true },
  { role: "SUPER_ADMIN", path: "/settings/smtp", allowed: true },
  { role: "SALES", path: "/delivery-orders/new", allowed: false },
  { role: "SALES", path: "/delivery-orders", allowed: true },
  { role: "HEAD", path: "/purchase-orders/new", allowed: true },
  { role: "HEAD", path: "/purchase-orders/abc", allowed: false },
  { role: "SALES", path: "/purchase-orders", allowed: true },
  { role: "EMPLOYEE", path: "/hr/hall-bookings", allowed: true },
  { role: "EMPLOYEE", path: "/hr/halls", allowed: false },
  { role: "SALES", path: "/hr/fuel", allowed: false },
  { role: "SALES", path: "/hr/my-fuel", allowed: true },
];

for (const probe of deniedProbes) {
  const decision = decidePage(probe.path, probe.role);
  assert.equal(
    decision.allowed,
    probe.allowed,
    `${probe.role} ${probe.path}`,
  );

  if (!probe.allowed && decision.redirect) {
    assert.equal(decision.redirect, "/dashboard");
  }
}

for (const role of ROLES) {
  const users = decidePage("/users", role);
  const tenders = decideApi(
    "GET",
    "/api/v1/procurement/tenders",
    role,
  );
  const usersApi = decideApi("GET", "/api/v1/users", role);
  const roleOne =
    role === "OWNER" || role === "SUPER_ADMIN" || role === "ADMIN";

  assert.equal(users.allowed, roleOne, `page users ${role}`);
  assert.equal(usersApi.matched && usersApi.allowed, roleOne, `api users ${role}`);
  assert.equal(
    tenders.matched && tenders.allowed,
    role !== "EMPLOYEE",
    `api tenders ${role}`,
  );
}

function apiAllowed(method: string, path: string, role: AppRole): boolean {
  const decision = decideApi(method, path, role);

  return decision.matched && decision.allowed;
}

assert.equal(apiAllowed("PATCH", "/api/v1/procurement/tenders/abc", "HR"), false);
assert.equal(
  apiAllowed("DELETE", "/api/v1/procurement/guarantees/abc", "SALES"),
  false,
);
assert.equal(apiAllowed("GET", "/api/v1/audit-logs", "EMPLOYEE"), false);
assert.equal(apiAllowed("GET", "/api/v1/audit-logs", "SALES"), true);
assert.equal(decideApi("GET", "/api/v1/company/current", "EMPLOYEE").matched, false);

assert.ok(PAGE_RULES.length > 0);
assert.ok(API_RULES.length > 0);

console.log("role-access.spec.ts passed");
