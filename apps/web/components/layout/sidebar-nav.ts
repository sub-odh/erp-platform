import {
  Boxes,
  Building2,
  CalendarCheck,
  CalendarDays,
  FilePlus,
  FileText,
  Fingerprint,
  Fuel,
  Gavel,
  Handshake,
  Home,
  Landmark,
  LineChart,
  LogOut,
  Mail,
  MapPinned,
  Network,
  Receipt,
  RotateCcw,
  ScrollText,
  Send,
  Settings,
  StickyNote,
  Truck,
  UserRound,
  Users,
  Wallet,
  Warehouse,
  type LucideIcon,
} from "lucide-react";

import {
  MENU_ROLE_ADMIN,
  MENU_ROLE_FULL,
  MENU_ROLE_SELF,
  MENU_ROLE_SALES_ONLY,
  MENU_ROLE_SALES_REPEAT,
  MENU_ROLE_TENDER,
  MENU_ROLE_WITH_SALES,
} from "@/lib/php-role-access";
import type { UserRole } from "@/types/auth";

export interface NavigationItem {
  label: string;
  icon: LucideIcon;
  href?: string;
  requiredModule?: string;
  roles?: UserRole[];
  children?: NavigationItem[];
}

export interface NavigationSection {
  id: string;
  title: string;
  requiredModule?: string;
  roles?: UserRole[];
  items: NavigationItem[];
}

const ROLE_PRIMARY = MENU_ROLE_FULL;
const ROLE_SALES_ONLY = MENU_ROLE_SALES_ONLY;
const ROLE_REPEAT = MENU_ROLE_SALES_REPEAT;
const ROLE_PROCUREMENT = MENU_ROLE_WITH_SALES;
const ROLE_TENDER = MENU_ROLE_TENDER;
const ROLE_HR = MENU_ROLE_FULL;
const ROLE_SELF = MENU_ROLE_SELF;
const ROLE_ADMIN = MENU_ROLE_ADMIN;

/**
 * Same order, labels and role gates as views/layout/sidebar.php.
 * Licence gating stays on top of the role check.
 */
export const navigationSections: NavigationSection[] = [
  {
    id: "main",
    title: "Main",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: Home },
    ],
  },
  {
    id: "sales-primary",
    title: "Sales & Logistics",
    roles: ROLE_PRIMARY,
    items: [
      { href: "/inventory", label: "Inventory", icon: Warehouse, requiredModule: "inventory" },
      { href: "/assets", label: "Assets", icon: Boxes, requiredModule: "inventory" },
      { href: "/inventory/logs", label: "Inventory Logs", icon: ScrollText, requiredModule: "inventory" },
      { href: "/item-returns", label: "Item Return", icon: RotateCcw, requiredModule: "inventory" },
      {
        label: "Proforma Invoice",
        icon: FileText,
        requiredModule: "sales",
        children: [
          { href: "/proforma-invoices/new", label: "Create PI", icon: FileText },
          { href: "/proforma-invoices", label: "View PI", icon: FileText },
        ],
      },
      {
        label: "Purchase Orders",
        icon: FileText,
        requiredModule: "inventory",
        children: [
          { href: "/purchase-orders/new", label: "Create PO", icon: FileText },
          { href: "/purchase-orders", label: "View All PO", icon: FileText },
        ],
      },
      {
        label: "Delivery Orders",
        icon: Truck,
        requiredModule: "inventory",
        children: [
          { href: "/delivery-orders/new", label: "Create New DO", icon: Truck },
          { href: "/delivery-orders", label: "View All Orders", icon: Truck },
        ],
      },
      {
        label: "Quotations",
        icon: Receipt,
        requiredModule: "sales",
        children: [
          { href: "/quotations/new", label: "Create Quotation", icon: Receipt },
          { href: "/quotations", label: "View Quotations", icon: Receipt },
          { href: "/sajilocloud/quotations", label: "SajiloCloud Quotations", icon: Receipt },
        ],
      },
      {
        label: "CRM",
        icon: Users,
        requiredModule: "sales",
        children: [
          { href: "/leads", label: "Sales Leads", icon: Users },
        ],
      },
      {
        label: "Sales Reports",
        icon: LineChart,
        requiredModule: "sales",
        children: [
          { href: "/sales-reports", label: "Sales Trend", icon: LineChart },
          { href: "/sales-reports/targets", label: "Target Achievement", icon: LineChart },
        ],
      },
      {
        href: "/payments",
        label: "Payments & Recovery",
        icon: Wallet,
        requiredModule: "sales",
      },
    ],
  },
  {
    id: "sales-only",
    title: "",
    roles: ROLE_SALES_ONLY,
    items: [
      {
        label: "Sales Reports",
        icon: LineChart,
        requiredModule: "sales",
        children: [
          { href: "/sales-reports", label: "Sales Trend", icon: LineChart },
          { href: "/sales-reports/targets", label: "Target Achievement", icon: LineChart },
        ],
      },
      {
        href: "/payments",
        label: "Payments & Recovery",
        icon: Wallet,
        requiredModule: "sales",
      },
    ],
  },
  {
    id: "sales-repeat",
    title: "Sales & Logistics",
    roles: ROLE_REPEAT,
    items: [
      { href: "/inventory", label: "Inventory", icon: Warehouse, requiredModule: "inventory" },
      {
        label: "Delivery Orders",
        icon: Truck,
        requiredModule: "inventory",
        children: [
          { href: "/delivery-orders", label: "View All Orders", icon: Truck },
        ],
      },
      {
        label: "Quotations",
        icon: Receipt,
        requiredModule: "sales",
        children: [
          { href: "/quotations/new", label: "Create Quotation", icon: Receipt },
          { href: "/quotations", label: "View Quotations", icon: Receipt },
        ],
      },
      {
        label: "CRM",
        icon: Users,
        requiredModule: "sales",
        children: [
          { href: "/leads", label: "Leads", icon: Users },
        ],
      },
    ],
  },
  {
    id: "procurement",
    title: "Procurement",
    requiredModule: "inventory",
    roles: ROLE_PROCUREMENT,
    items: [
      {
        href: "/procurement/tenders",
        label: "Tender Management",
        icon: Gavel,
        roles: ROLE_TENDER,
      },
      {
        href: "/procurement/tender-calendar",
        label: "Tender Calendar",
        icon: CalendarCheck,
      },
      {
        href: "/procurement/guarantees",
        label: "BG | PG Guarantee",
        icon: Landmark,
      },
    ],
  },
  {
    id: "hr",
    title: "HR & Operations",
    roles: ROLE_HR,
    items: [
      { href: "/hr/employees", label: "Employee Management", icon: UserRound },
      { href: "/hr/employee-list", label: "All Employee List", icon: UserRound },
      { href: "/hr/clients", label: "Clients Management", icon: Mail },
      { href: "/hr/holidays", label: "Holiday Management", icon: CalendarDays },
      { href: "/hr/support-visits", label: "All Support Visits", icon: CalendarDays },
      { href: "/hr/company-calendar", label: "Company Calendar", icon: CalendarCheck },
      { href: "/hr/attendance", label: "Attendance", icon: Fingerprint },
      { href: "/hr/attendance-report", label: "Attendance Report", icon: Fingerprint },
      { href: "/hr/memos/new", label: "Create Memo", icon: FilePlus },
      { href: "/hr/memos", label: "Memo Lists", icon: StickyNote },
      { href: "/hr/leaves", label: "Leave Management", icon: Mail },
      { href: "/hr/tada", label: "TADA Management", icon: Fuel },
      { href: "/hr/fuel", label: "Fuel Management", icon: Fuel },
      { href: "/hr/halls", label: "Meeting Hall Management", icon: Building2 },
      { href: "/hr/partners", label: "Partner Management", icon: Handshake },
    ],
  },
  {
    id: "self",
    title: "Self Service",
    roles: ROLE_SELF,
    items: [
      { href: "/hr/company-holidays", label: "Company Holidays", icon: CalendarDays },
      { href: "/hr/hall-bookings", label: "Book Meeting Hall", icon: Building2 },
      { href: "/hr/hierarchy", label: "Hierarchy", icon: Network },
      { href: "/hr/support-visits/new", label: "Support Visit Form", icon: FileText },
      { href: "/hr/my-support-visits", label: "My Support Visits", icon: MapPinned },
      { href: "/hr/my-leaves", label: "My Leaves", icon: Send },
      { href: "/hr/field-visits", label: "Field Visits", icon: LogOut },
      {
        label: "Expenses",
        icon: Receipt,
        children: [
          { href: "/hr/my-tada", label: "My TA/DA Request", icon: Receipt },
          { href: "/hr/my-fuel", label: "My Fuel Records", icon: Fuel },
        ],
      },
    ],
  },
  {
    id: "admin",
    title: "Administration",
    requiredModule: "admin",
    roles: ROLE_ADMIN,
    items: [
      { href: "/users", label: "Manage Users", icon: Users },
      { href: "/settings/company", label: "Company Settings", icon: Settings },
      { href: "/settings/smtp", label: "SMTP Settings", icon: Mail },
    ],
  },
  {
    id: "logs",
    title: "Log Viewer",
    requiredModule: "admin",
    roles: ROLE_ADMIN,
    items: [
      { href: "/logs", label: "View Logs", icon: ScrollText },
    ],
  },
];
