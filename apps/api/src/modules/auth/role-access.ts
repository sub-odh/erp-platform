/*
 * PHP role 1 is Super Admin (views/layout/sidebar.php lines 8-9).
 * OWNER, SUPER_ADMIN and ADMIN stand in for that role.
 * MANAGER follows Operations (role 3). STAFF follows Sales (role 5).
 */
export const PHP_ROLE_1 = ["OWNER", "SUPER_ADMIN", "ADMIN"] as const;

export type AppRole =
  | (typeof PHP_ROLE_1)[number]
  | "ADMIN"
  | "HR"
  | "OPERATIONS"
  | "MANAGER"
  | "EMPLOYEE"
  | "SALES"
  | "STAFF"
  | "MANAGEMENT"
  | "HEAD";

const ROLES_FOR_PHP_ID: Record<number, readonly AppRole[]> = {
  1: PHP_ROLE_1,
  2: ["HR"],
  3: ["OPERATIONS", "MANAGER"],
  4: ["EMPLOYEE"],
  5: ["SALES", "STAFF"],
  6: ["MANAGEMENT"],
  7: ["HEAD"],
};

export function rolesForPhpIds(ids: readonly number[]): AppRole[] {
  const roles = new Set<AppRole>();

  for (const id of ids) {
    for (const role of ROLES_FOR_PHP_ID[id] ?? []) {
      roles.add(role);
    }
  }

  return [...roles];
}

/** PHP roles 1, 2, 3, 6, 7. The first Sales & Logistics block. */
export const MENU_ROLE_FULL = rolesForPhpIds([1, 2, 3, 6, 7]);

/** PHP roles 1, 2, 3, 5, 6, 7. Procurement. */
export const MENU_ROLE_WITH_SALES = rolesForPhpIds([1, 2, 3, 5, 6, 7]);

/** Sales role only. Reports and payments sit above the second Sales block. */
export const MENU_ROLE_SALES_ONLY = rolesForPhpIds([5]);

/** Second Sales & Logistics block: Sales, Management and Head (sidebar.php line 140). */
export const MENU_ROLE_SALES_REPEAT = rolesForPhpIds([5, 6, 7]);

/** Tender Management link is PHP roles 1 and 5 (sidebar.php line 178). */
export const MENU_ROLE_TENDER = rolesForPhpIds([1, 5]);

/** Self service omits HR (sidebar.php line 204). */
export const MENU_ROLE_SELF = rolesForPhpIds([1, 3, 4, 5, 6, 7]);

/** Administration and Log Viewer are PHP role 1 (sidebar.php lines 226-235). */
export const MENU_ROLE_ADMIN = rolesForPhpIds([1]);

export type PhpDeny = "index" | "login" | "dashboard" | "unauthorized";

export interface PageRule {
  prefix: string;
  phpIds: readonly number[];
  deny: PhpDeny;
  phpFile: string;
}

/*
 * Longest prefix wins. These are the role checks at the top of the PHP file,
 * which are wider or narrower than the sidebar on several pages.
 */
export const PAGE_RULES: readonly PageRule[] = [
  {
    prefix: "/procurement/tenders",
    phpIds: [1, 2, 3, 5, 6, 7],
    deny: "index",
    phpFile: "views/admin/tenders.php",
  },
  {
    prefix: "/procurement/tender-calendar",
    phpIds: [1, 3, 5, 6, 7],
    deny: "login",
    phpFile: "views/admin/tender_view.php",
  },
  {
    prefix: "/procurement/guarantees",
    phpIds: [1, 2, 3, 5, 6, 7],
    deny: "dashboard",
    phpFile: "views/admin/guarantee_tracker.php",
  },
  {
    prefix: "/users",
    phpIds: [1],
    deny: "index",
    phpFile: "views/admin/users.php",
  },
  {
    prefix: "/settings/smtp",
    phpIds: [1],
    deny: "dashboard",
    phpFile: "views/admin/smtp_settings.php",
  },
  {
    prefix: "/settings/company",
    phpIds: [1],
    deny: "login",
    phpFile: "views/admin/company_settings.php",
  },
  {
    prefix: "/logs",
    phpIds: [1],
    deny: "index",
    phpFile: "views/admin/logs.php",
  },
  {
    prefix: "/purchase-orders/new",
    phpIds: [1, 2, 3, 5, 6, 7],
    deny: "dashboard",
    phpFile: "views/admin/create_purchase_order.php",
  },
  {
    prefix: "/purchase-orders/",
    phpIds: [1, 2, 3, 5, 6, 7],
    deny: "dashboard",
    phpFile: "views/admin/po_print.php",
  },
  {
    prefix: "/purchase-orders",
    phpIds: [1, 2, 3, 5, 6, 7],
    deny: "dashboard",
    phpFile: "views/admin/po_dashboard.php",
  },
  {
    prefix: "/delivery-orders/new",
    phpIds: [1, 2, 3, 6, 7],
    deny: "login",
    phpFile: "views/admin/do_create.php",
  },
  {
    prefix: "/delivery-orders",
    phpIds: [1, 2, 3, 5, 6, 7],
    deny: "index",
    phpFile: "views/admin/do_list.php",
  },
  {
    prefix: "/inventory/master",
    phpIds: [1, 2, 3, 5, 6, 7],
    deny: "index",
    phpFile: "views/admin/inventory.php",
  },
  {
    prefix: "/sajilocloud/quotations/new",
    phpIds: [1, 2, 3, 5, 6, 7],
    deny: "dashboard",
    phpFile: "views/sajilocloud/create_quotation.php",
  },
  {
    prefix: "/sajilocloud/quotations",
    phpIds: [1, 2, 3, 5, 6, 7],
    deny: "dashboard",
    phpFile: "views/sajilocloud/quotation_dashboard.php",
  },
  {
    prefix: "/quotations/new",
    phpIds: [1, 2, 3, 5, 6, 7],
    deny: "dashboard",
    phpFile: "views/admin/create_quotation.php",
  },
  {
    prefix: "/quotations",
    phpIds: [1, 2, 3, 5, 6, 7],
    deny: "dashboard",
    phpFile: "views/admin/quotation_dashboard.php",
  },
  {
    prefix: "/leads",
    phpIds: [1, 2, 3, 5, 6, 7],
    deny: "index",
    phpFile: "views/admin/sales_tracker.php",
  },
  {
    prefix: "/payments",
    phpIds: [1, 2, 3, 5, 6, 7],
    deny: "login",
    phpFile: "views/admin/recovery_list.php",
  },
  {
    prefix: "/sales-reports/targets",
    phpIds: [1, 2, 3, 5, 6, 7],
    deny: "index",
    phpFile: "views/admin/sales_target_achievement.php",
  },
  {
    prefix: "/sales-reports",
    phpIds: [1, 2, 3, 5, 6, 7],
    deny: "login",
    phpFile: "views/admin/sales_report.php",
  },
  {
    prefix: "/invoices",
    phpIds: [1, 2, 3, 5, 6, 7],
    deny: "login",
    phpFile: "views/admin/view_invoice.php",
  },
  {
    prefix: "/proforma-invoices",
    phpIds: [1, 2, 3, 5, 6, 7],
    deny: "dashboard",
    phpFile: "views/admin/pi_dashboard.php",
  },
  {
    prefix: "/hr/employees/new",
    phpIds: [1, 2, 3, 5, 6, 7],
    deny: "index",
    phpFile: "views/admin/employee_form.php",
  },
  {
    prefix: "/hr/employees/",
    phpIds: [1, 2, 3, 5, 6, 7],
    deny: "index",
    phpFile: "views/admin/employee_form.php",
  },
  {
    prefix: "/hr/employees",
    phpIds: [1, 2, 3, 6, 7],
    deny: "index",
    phpFile: "views/admin/employees.php",
  },
  {
    prefix: "/hr/holidays",
    phpIds: [1, 2, 3, 6, 7],
    deny: "index",
    phpFile: "views/admin/holidays.php",
  },
  {
    prefix: "/hr/attendance-report",
    phpIds: [1, 2, 3, 5, 6, 7],
    deny: "login",
    phpFile: "views/admin/attendance_report.php",
  },
  {
    prefix: "/hr/tada",
    phpIds: [1, 2, 3],
    deny: "dashboard",
    phpFile: "views/admin/tada_management.php",
  },
  {
    prefix: "/hr/fuel",
    phpIds: [1, 2, 3],
    deny: "index",
    phpFile: "views/admin/fuel_management.php",
  },
  {
    prefix: "/hr/halls",
    phpIds: [1, 2],
    deny: "index",
    phpFile: "views/admin/halls.php",
  },
  {
    prefix: "/hr/partners",
    phpIds: [1, 2],
    deny: "login",
    phpFile: "views/admin/ourpartners.php",
  },
  {
    prefix: "/hr/leaves",
    phpIds: [1, 2, 3, 4, 5, 6, 7],
    deny: "index",
    phpFile: "views/admin/leave_management.php",
  },
  {
    prefix: "/profile",
    phpIds: [1, 2, 3, 4, 5, 6, 7],
    deny: "index",
    phpFile: "views/employee/my_profile.php",
  },
  {
    prefix: "/hr/my-attendance",
    phpIds: [1, 2, 3, 4, 5, 6, 7],
    deny: "login",
    phpFile: "views/employee/my_attendance.php",
  },
];

export const UNGUARDED_PHP_PAGES = [
  "dashboard.php (user_id only)",
  "views/admin/assets.php",
  "views/admin/inventory_logs.php",
  "views/admin/inventory_return.php",
  "views/admin/memo_list.php (user_id only)",
  "views/admin/client_view.php",
  "views/admin/field_visit.php (user_id only)",
  "views/admin/hierarchy.php (any role_id)",
  "views/hr/attendance.php",
  "views/hr/all_client_visit.php",
  "views/hr/visit_form.php",
  "views/hr/memo_create.php",
  "views/employee/holidays.php",
  "views/employee/calendar.php (user_id only)",
  "views/employee/leave_request.php (user_id only)",
  "views/employee/tada_request.php (user_id only)",
  "views/employee/fuel_records.php (user_id only)",
  "views/employee/book_hall.php (user_id only)",
  "views/employee/employees.php (any role_id)",
] as const;

export interface PageDecision {
  allowed: boolean;
  phpFile: string | null;
  phpIds: readonly number[] | null;
  deny: PhpDeny | null;
  /*
   * A signed-in user who hits index.php or login.php is sent to the
   * dashboard by login.php. That is the redirect the shell uses.
   */
  redirect: "/dashboard" | null;
}

function pathMatches(pathname: string, prefix: string): boolean {
  if (pathname === prefix || pathname === prefix.replace(/\/$/, "")) {
    return true;
  }

  const base = prefix.endsWith("/") ? prefix : `${prefix}/`;

  return pathname.startsWith(base);
}

export function decidePage(
  pathname: string,
  role: AppRole | null,
): PageDecision {
  const rule = [...PAGE_RULES]
    .sort((left, right) => right.prefix.length - left.prefix.length)
    .find((candidate) => pathMatches(pathname, candidate.prefix));

  if (!rule) {
    return {
      allowed: true,
      phpFile: null,
      phpIds: null,
      deny: null,
      redirect: null,
    };
  }

  const allowed = role !== null && rolesForPhpIds(rule.phpIds).includes(role);

  if (allowed) {
    return {
      allowed: true,
      phpFile: rule.phpFile,
      phpIds: rule.phpIds,
      deny: null,
      redirect: null,
    };
  }

  return {
    allowed: false,
    phpFile: rule.phpFile,
    phpIds: rule.phpIds,
    deny: rule.deny,
    redirect: rule.deny === "unauthorized" ? null : "/dashboard",
  };
}

export interface ApiRule {
  methods: readonly string[];
  pattern: RegExp;
  phpIds: readonly number[];
  deny: PhpDeny;
  phpFile: string;
  label: string;
}

export const API_RULES: readonly ApiRule[] = [
  {
    methods: ["GET", "POST"],
    pattern: /^procurement\/tenders$/,
    phpIds: [1, 2, 3, 5, 6, 7],
    deny: "unauthorized",
    phpFile: "controllers/save_tender.php",
    label: "GET/POST procurement/tenders",
  },
  {
    methods: ["PATCH", "DELETE"],
    pattern: /^procurement\/tenders\/[^/]+$/,
    phpIds: [1, 3, 5, 6, 7],
    deny: "unauthorized",
    phpFile: "controllers/manage_tender_action.php",
    label: "PATCH/DELETE procurement/tenders/:id",
  },
  {
    methods: ["DELETE"],
    pattern: /^procurement\/guarantees\/[^/]+$/,
    phpIds: [1],
    deny: "unauthorized",
    phpFile: "views/admin/guarantee_tracker.php",
    label: "DELETE procurement/guarantees/:id",
  },
  {
    methods: ["GET", "POST", "PATCH"],
    pattern: /^procurement\/guarantees(\/.*)?$/,
    phpIds: [1, 2, 3, 5, 6, 7],
    deny: "dashboard",
    phpFile: "views/admin/guarantee_tracker.php",
    label: "procurement/guarantees",
  },
  {
    methods: ["GET", "POST", "PATCH", "DELETE"],
    pattern: /^users(\/.*)?$/,
    phpIds: [1],
    deny: "index",
    phpFile: "views/admin/users.php",
    label: "users",
  },
  {
    methods: ["GET", "POST", "PATCH", "DELETE"],
    pattern: /^smtp(\/.*)?$/,
    phpIds: [1],
    deny: "dashboard",
    phpFile: "views/admin/smtp_settings.php",
    label: "smtp",
  },
  {
    methods: ["GET"],
    pattern: /^company\/current\/backup-archive(\/[^/]+)?$/,
    phpIds: [1],
    deny: "login",
    phpFile: "views/admin/company_settings.php",
    label: "GET company backup archive",
  },
  {
    methods: ["PATCH", "POST", "DELETE"],
    pattern: /^company\/current(\/.*)?$/,
    phpIds: [1],
    deny: "login",
    phpFile: "views/admin/company_settings.php",
    label: "company settings write",
  },
  {
    methods: ["GET"],
    pattern: /^audit-logs(\/.*)?$/,
    phpIds: [1],
    deny: "index",
    phpFile: "views/admin/logs.php",
    label: "GET audit-logs",
  },
  {
    methods: ["GET"],
    pattern:
      /^operations\/delivery-orders(\/(available-assets|lookups|draft|[^/]+))?$/,
    phpIds: [1, 2, 3, 5, 6, 7],
    deny: "index",
    phpFile: "views/admin/do_list.php",
    label: "GET delivery-orders",
  },
  {
    methods: ["POST"],
    pattern: /^operations\/delivery-orders$/,
    phpIds: [1, 2, 3, 6, 7],
    deny: "login",
    phpFile: "views/admin/do_create.php",
    label: "POST delivery-orders",
  },
  {
    methods: ["PUT"],
    pattern: /^operations\/delivery-orders\/[^/]+$/,
    phpIds: [1, 2, 3, 6],
    deny: "index",
    phpFile: "views/admin/do_edit.php",
    label: "PUT delivery-orders/:id",
  },
  {
    methods: ["POST"],
    pattern: /^operations\/delivery-orders\/[^/]+\/void$/,
    phpIds: [1, 2, 3, 5, 6, 7],
    deny: "index",
    phpFile: "views/admin/do_void.php",
    label: "POST delivery-orders void",
  },
  {
    methods: ["POST"],
    pattern: /^operations\/delivery-orders\/[^/]+\/purge$/,
    phpIds: [1],
    deny: "index",
    phpFile: "views/admin/do_delete.php",
    label: "POST delivery-orders purge",
  },
  {
    methods: ["GET"],
    pattern: /^operations\/purchase-orders(\/draft)?$/,
    phpIds: [1, 2, 3, 5, 6, 7],
    deny: "dashboard",
    phpFile: "views/admin/po_dashboard.php",
    label: "GET purchase-orders",
  },
  {
    methods: ["POST"],
    pattern: /^operations\/purchase-orders(\/dispatch-email)?$/,
    phpIds: [1, 2, 3, 5, 6, 7],
    deny: "dashboard",
    phpFile: "views/admin/create_purchase_order.php",
    label: "POST purchase-orders",
  },
  {
    methods: ["GET"],
    pattern: /^operations\/purchase-orders\/[^/]+$/,
    phpIds: [1, 2, 3, 5, 6, 7],
    deny: "dashboard",
    phpFile: "views/admin/po_print.php",
    label: "GET purchase-orders/:id",
  },
  {
    methods: ["PUT"],
    pattern: /^operations\/purchase-orders\/[^/]+$/,
    phpIds: [1, 2, 3, 5, 6],
    deny: "dashboard",
    phpFile: "views/admin/edit_purchase_order.php",
    label: "PUT purchase-orders/:id",
  },
  {
    methods: ["POST"],
    pattern: /^operations\/purchase-orders\/[^/]+\/purge$/,
    phpIds: [1, 2, 3, 5, 6, 7],
    deny: "dashboard",
    phpFile: "views/admin/po_dashboard.php",
    label: "POST purchase-orders purge",
  },
  {
    methods: ["GET"],
    pattern: /^operations\/inventory\/(dashboard|assets|assets\/export|assets\/sample|assets\/[^/]+|movements)$/,
    phpIds: [1, 2, 3, 5, 6, 7],
    deny: "index",
    phpFile: "views/admin/inventory.php",
    label: "GET inventory",
  },
  {
    methods: ["POST"],
    pattern: /^sales\/cloud-quotations\/[^/]+\/purge$/,
    phpIds: [1],
    deny: "dashboard",
    phpFile: "views/sajilocloud/quotation_dashboard.php",
    label: "POST cloud-quotations purge",
  },
  {
    methods: ["GET", "POST", "PUT"],
    pattern: /^sales\/cloud-quotations(\/.*)?$/,
    phpIds: [1, 2, 3, 5, 6, 7],
    deny: "dashboard",
    phpFile: "views/sajilocloud/quotation_dashboard.php",
    label: "cloud-quotations",
  },
  {
    methods: ["GET", "POST", "PUT", "DELETE"],
    pattern: /^sales\/quotations(\/.*)?$/,
    phpIds: [1, 2, 3, 5, 6, 7],
    deny: "dashboard",
    phpFile: "views/admin/quotation_dashboard.php",
    label: "quotations",
  },
  {
    methods: ["GET", "POST", "PUT"],
    pattern: /^sales\/proforma-invoices(\/.*)?$/,
    phpIds: [1, 2, 3, 5, 6, 7],
    deny: "dashboard",
    phpFile: "views/admin/pi_dashboard.php",
    label: "proforma-invoices",
  },
  {
    methods: ["GET", "POST", "PUT", "PATCH"],
    pattern: /^sales\/leads(\/.*)?$/,
    phpIds: [1, 2, 3, 5, 6, 7],
    deny: "index",
    phpFile: "views/admin/sales_tracker.php",
    label: "leads",
  },
  {
    methods: ["GET"],
    pattern: /^sales\/reports(\/.*)?$/,
    phpIds: [1, 2, 3, 5, 6, 7],
    deny: "login",
    phpFile: "views/admin/sales_report.php",
    label: "sales reports",
  },
  {
    methods: ["POST"],
    pattern: /^sales\/recoveries\/[^/]+\/(payments|void|reminder)$/,
    phpIds: [1, 2, 3, 6, 7],
    deny: "login",
    phpFile: "controllers/process_payment.php",
    label: "POST recoveries collect",
  },
  {
    methods: ["GET"],
    pattern: /^sales\/recoveries(\/.*)?$/,
    phpIds: [1, 2, 3, 5, 6, 7],
    deny: "login",
    phpFile: "views/admin/recovery_list.php",
    label: "GET recoveries",
  },
  {
    methods: ["GET"],
    pattern: /^hr\/leaves$/,
    phpIds: [1, 2, 3, 4, 5, 6, 7],
    deny: "index",
    phpFile: "views/admin/leave_management.php",
    label: "GET hr/leaves",
  },
  {
    methods: ["POST"],
    pattern: /^hr\/leaves\/emergency$/,
    phpIds: [1, 2],
    deny: "unauthorized",
    phpFile: "views/admin/leave_management.php",
    label: "POST hr/leaves/emergency",
  },
  {
    methods: ["PATCH"],
    pattern: /^hr\/leaves\/balances$/,
    phpIds: [1, 2],
    deny: "unauthorized",
    phpFile: "views/admin/leave_management.php",
    label: "PATCH hr/leaves/balances",
  },
  {
    methods: ["POST"],
    pattern: /^hr\/leaves\/[^/]+\/(approve|reject)$/,
    phpIds: [1, 2, 3, 6, 7],
    deny: "unauthorized",
    phpFile: "views/admin/leave_management.php",
    label: "POST hr/leaves approve/reject",
  },
  {
    methods: ["GET"],
    pattern: /^hr\/fuel$/,
    phpIds: [1, 2, 3],
    deny: "index",
    phpFile: "views/admin/fuel_management.php",
    label: "GET hr/fuel",
  },
  {
    methods: ["PATCH"],
    pattern: /^hr\/fuel\/settings$/,
    phpIds: [1],
    deny: "index",
    phpFile: "views/admin/fuel_rates.php",
    label: "PATCH hr/fuel/settings",
  },
  {
    methods: ["POST"],
    pattern: /^hr\/fuel\/[^/]+\/(approve|reject|reimburse)$/,
    phpIds: [1, 2, 3],
    deny: "index",
    phpFile: "views/admin/fuel_management.php",
    label: "POST hr/fuel review",
  },
  {
    methods: ["GET"],
    pattern: /^hr\/tada$/,
    phpIds: [1, 2, 3],
    deny: "dashboard",
    phpFile: "views/admin/tada_management.php",
    label: "GET hr/tada",
  },
  {
    methods: ["POST"],
    pattern: /^hr\/tada\/[^/]+\/(approve|reject)$/,
    phpIds: [1, 2, 3],
    deny: "dashboard",
    phpFile: "views/admin/tada_management.php",
    label: "POST hr/tada review",
  },
  {
    methods: ["POST", "PATCH", "DELETE"],
    pattern: /^hr\/halls(\/.*)?$/,
    phpIds: [1, 2],
    deny: "unauthorized",
    phpFile: "views/admin/halls.php",
    label: "hr/halls write",
  },
  {
    methods: ["POST"],
    pattern: /^hr\/hall-bookings\/[^/]+\/confirm$/,
    phpIds: [1, 2],
    deny: "unauthorized",
    phpFile: "controllers/approve_booking.php",
    label: "POST hall booking confirm",
  },
  {
    methods: ["POST", "PATCH", "DELETE"],
    pattern: /^hr\/holidays(\/.*)?$/,
    phpIds: [1, 2, 3, 6, 7],
    deny: "unauthorized",
    phpFile: "views/admin/save_holiday.php",
    label: "hr/holidays write",
  },
  {
    methods: ["GET"],
    pattern: /^hr\/employees$/,
    phpIds: [1, 2, 3, 6, 7],
    deny: "index",
    phpFile: "views/admin/employees.php",
    label: "GET hr/employees",
  },
  {
    methods: ["POST"],
    pattern: /^hr\/employees$/,
    phpIds: [1, 2, 3, 5, 6, 7],
    deny: "index",
    phpFile: "views/admin/process_employee.php",
    label: "POST hr/employees",
  },
  {
    methods: ["PATCH"],
    pattern: /^hr\/employees\/[^/]+$/,
    phpIds: [1, 2, 3, 5, 6, 7],
    deny: "index",
    phpFile: "views/admin/process_employee.php",
    label: "PATCH hr/employees/:id",
  },
  {
    methods: ["POST"],
    pattern: /^hr\/employees\/[^/]+\/(deactivate|restore)$/,
    phpIds: [1, 2, 3],
    deny: "login",
    phpFile: "views/admin/delete_employee.php",
    label: "POST hr/employees deactivate",
  },
  {
    methods: ["GET", "POST", "PATCH", "DELETE"],
    pattern: /^hr\/partners(\/.*)?$/,
    phpIds: [1, 2],
    deny: "login",
    phpFile: "views/admin/ourpartners.php",
    label: "hr/partners",
  },
  {
    methods: ["GET"],
    pattern: /^hr\/attendance\/report$/,
    phpIds: [1, 2, 3, 5, 6, 7],
    deny: "login",
    phpFile: "views/admin/attendance_report.php",
    label: "GET attendance report",
  },
  {
    methods: ["PATCH"],
    pattern: /^hr\/attendance\/[^/]+$/,
    phpIds: [1, 2],
    deny: "login",
    phpFile: "views/admin/attendance_report.php",
    label: "PATCH attendance punch",
  },
  {
    methods: ["GET"],
    pattern: /^finance\/invoices(\/.*)?$/,
    phpIds: [1, 2, 3, 5, 6, 7],
    deny: "login",
    phpFile: "views/admin/view_invoice.php",
    label: "GET invoices",
  },
];

export type ApiDecision =
  | { matched: false }
  | {
      matched: true;
      allowed: boolean;
      phpFile: string;
      phpIds: readonly number[];
      label: string;
      deny: PhpDeny;
    };

export function normalizeApiPath(path: string): string {
  const withoutQuery = path.split("?")[0] ?? path;

  return withoutQuery.replace(/^\/api\/v\d+\//, "").replace(/^\//, "");
}

export function decideApi(
  method: string | undefined,
  path: string | undefined,
  role: AppRole | null,
): ApiDecision {
  const normalized = normalizeApiPath(path ?? "");
  const verb = (method ?? "").toUpperCase();
  const rule = API_RULES.find(
    (candidate) =>
      candidate.methods.includes(verb) && candidate.pattern.test(normalized),
  );

  if (!rule) {
    return { matched: false };
  }

  return {
    matched: true,
    allowed: role !== null && rolesForPhpIds(rule.phpIds).includes(role),
    phpFile: rule.phpFile,
    phpIds: rule.phpIds,
    label: rule.label,
    deny: rule.deny,
  };
}

export interface MenuRow {
  section: string;
  label: string;
  roles: readonly AppRole[] | null;
  license?: string;
}

const inventory = "inventory";
const sales = "sales";

/** Rows the sidebar shows, in menu order. null roles means every role. */
export const MENU_ROWS: readonly MenuRow[] = [
  { section: "Main", label: "Dashboard", roles: null },

  { section: "Sales & Logistics", label: "Inventory", roles: MENU_ROLE_FULL, license: inventory },
  { section: "Sales & Logistics", label: "Assets", roles: MENU_ROLE_FULL, license: inventory },
  { section: "Sales & Logistics", label: "Inventory Logs", roles: MENU_ROLE_FULL, license: inventory },
  { section: "Sales & Logistics", label: "Item Return", roles: MENU_ROLE_FULL, license: inventory },
  { section: "Sales & Logistics", label: "Proforma Invoice", roles: MENU_ROLE_FULL, license: sales },
  { section: "Sales & Logistics", label: "Create PI", roles: MENU_ROLE_FULL, license: sales },
  { section: "Sales & Logistics", label: "View PI", roles: MENU_ROLE_FULL, license: sales },
  { section: "Sales & Logistics", label: "Purchase Orders", roles: MENU_ROLE_FULL, license: inventory },
  { section: "Sales & Logistics", label: "Create PO", roles: MENU_ROLE_FULL, license: inventory },
  { section: "Sales & Logistics", label: "View All PO", roles: MENU_ROLE_FULL, license: inventory },
  { section: "Sales & Logistics", label: "Delivery Orders", roles: MENU_ROLE_FULL, license: inventory },
  { section: "Sales & Logistics", label: "Create New DO", roles: MENU_ROLE_FULL, license: inventory },
  { section: "Sales & Logistics", label: "View All Orders", roles: MENU_ROLE_FULL, license: inventory },
  { section: "Sales & Logistics", label: "Quotations", roles: MENU_ROLE_FULL, license: sales },
  { section: "Sales & Logistics", label: "Create Quotation", roles: MENU_ROLE_FULL, license: sales },
  { section: "Sales & Logistics", label: "View Quotations", roles: MENU_ROLE_FULL, license: sales },
  { section: "Sales & Logistics", label: "SajiloCloud Quotations", roles: MENU_ROLE_FULL, license: sales },
  { section: "Sales & Logistics", label: "CRM", roles: MENU_ROLE_FULL, license: sales },
  { section: "Sales & Logistics", label: "Sales Leads", roles: MENU_ROLE_FULL, license: sales },
  { section: "Sales & Logistics", label: "Sales Reports", roles: MENU_ROLE_FULL, license: sales },
  { section: "Sales & Logistics", label: "Sales Trend", roles: MENU_ROLE_FULL, license: sales },
  { section: "Sales & Logistics", label: "Target Achievement", roles: MENU_ROLE_FULL, license: sales },
  { section: "Sales & Logistics", label: "Payments & Recovery", roles: MENU_ROLE_FULL, license: sales },

  { section: "", label: "Sales Reports", roles: MENU_ROLE_SALES_ONLY, license: sales },
  { section: "", label: "Sales Trend", roles: MENU_ROLE_SALES_ONLY, license: sales },
  { section: "", label: "Target Achievement", roles: MENU_ROLE_SALES_ONLY, license: sales },
  { section: "", label: "Payments & Recovery", roles: MENU_ROLE_SALES_ONLY, license: sales },

  { section: "Sales & Logistics", label: "Inventory", roles: MENU_ROLE_SALES_REPEAT, license: inventory },
  { section: "Sales & Logistics", label: "Delivery Orders", roles: MENU_ROLE_SALES_REPEAT, license: inventory },
  { section: "Sales & Logistics", label: "View All Orders", roles: MENU_ROLE_SALES_REPEAT, license: inventory },
  { section: "Sales & Logistics", label: "Quotations", roles: MENU_ROLE_SALES_REPEAT, license: sales },
  { section: "Sales & Logistics", label: "Create Quotation", roles: MENU_ROLE_SALES_REPEAT, license: sales },
  { section: "Sales & Logistics", label: "View Quotations", roles: MENU_ROLE_SALES_REPEAT, license: sales },
  { section: "Sales & Logistics", label: "CRM", roles: MENU_ROLE_SALES_REPEAT, license: sales },
  { section: "Sales & Logistics", label: "Leads", roles: MENU_ROLE_SALES_REPEAT, license: sales },

  { section: "Procurement", label: "Tender Management", roles: MENU_ROLE_TENDER, license: inventory },
  { section: "Procurement", label: "Tender Calendar", roles: MENU_ROLE_WITH_SALES, license: inventory },
  { section: "Procurement", label: "BG | PG Guarantee", roles: MENU_ROLE_WITH_SALES, license: inventory },

  { section: "HR & Operations", label: "Employee Management", roles: MENU_ROLE_FULL },
  { section: "HR & Operations", label: "All Employee List", roles: MENU_ROLE_FULL },
  { section: "HR & Operations", label: "Clients Management", roles: MENU_ROLE_FULL },
  { section: "HR & Operations", label: "Holiday Management", roles: MENU_ROLE_FULL },
  { section: "HR & Operations", label: "All Support Visits", roles: MENU_ROLE_FULL },
  { section: "HR & Operations", label: "Company Calendar", roles: MENU_ROLE_FULL },
  { section: "HR & Operations", label: "Attendance", roles: MENU_ROLE_FULL },
  { section: "HR & Operations", label: "Attendance Report", roles: MENU_ROLE_FULL },
  { section: "HR & Operations", label: "Create Memo", roles: MENU_ROLE_FULL },
  { section: "HR & Operations", label: "Memo Lists", roles: MENU_ROLE_FULL },
  { section: "HR & Operations", label: "Leave Management", roles: MENU_ROLE_FULL },
  { section: "HR & Operations", label: "TADA Management", roles: MENU_ROLE_FULL },
  { section: "HR & Operations", label: "Fuel Management", roles: MENU_ROLE_FULL },
  { section: "HR & Operations", label: "Meeting Hall Management", roles: MENU_ROLE_FULL },
  { section: "HR & Operations", label: "Partner Management", roles: MENU_ROLE_FULL },

  { section: "Self Service", label: "Company Holidays", roles: MENU_ROLE_SELF },
  { section: "Self Service", label: "Book Meeting Hall", roles: MENU_ROLE_SELF },
  { section: "Self Service", label: "Hierarchy", roles: MENU_ROLE_SELF },
  { section: "Self Service", label: "Support Visit Form", roles: MENU_ROLE_SELF },
  { section: "Self Service", label: "My Support Visits", roles: MENU_ROLE_SELF },
  { section: "Self Service", label: "My Leaves", roles: MENU_ROLE_SELF },
  { section: "Self Service", label: "Field Visits", roles: MENU_ROLE_SELF },
  { section: "Self Service", label: "Expenses", roles: MENU_ROLE_SELF },
  { section: "Self Service", label: "My TA/DA Request", roles: MENU_ROLE_SELF },
  { section: "Self Service", label: "My Fuel Records", roles: MENU_ROLE_SELF },

  { section: "Administration", label: "Manage Users", roles: MENU_ROLE_ADMIN, license: "admin" },
  { section: "Administration", label: "Company Settings", roles: MENU_ROLE_ADMIN, license: "admin" },
  { section: "Administration", label: "SMTP Settings", roles: MENU_ROLE_ADMIN, license: "admin" },
  { section: "Log Viewer", label: "View Logs", roles: MENU_ROLE_ADMIN, license: "admin" },
];

export function visibleMenu(
  role: AppRole,
  licensedModules: readonly string[] = ["inventory", "sales", "admin"],
): MenuRow[] {
  return MENU_ROWS.filter((row) => {
    if (row.license && !licensedModules.includes(row.license)) {
      return false;
    }

    return row.roles === null || row.roles.includes(role);
  });
}

export function visibleMenuLabels(
  role: AppRole,
  licensedModules: readonly string[] = ["inventory", "sales", "admin"],
): string[] {
  return visibleMenu(role, licensedModules).map((row) => row.label);
}
