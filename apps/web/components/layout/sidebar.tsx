"use client";

import {
  BarChart3,
  Boxes,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  FileText,
  Gauge,
  Handshake,
  Mail,
  LayoutDashboard,
  Package,
  ReceiptText,
  Settings,
  ShoppingCart,
  Target,
  Truck,
  UserRound,
  Users,
  Warehouse,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ComponentType } from "react";

import { resolveMediaUrl } from "@/lib/company";
import { getStoredLicense } from "@/lib/auth";
import type { LicenseSummary } from "@/types/auth";
import type { Company } from "@/types/company";

interface SidebarProps {
  open: boolean;
  collapsed: boolean;

  company: Company | null;

  onClose: () => void;

  onToggleCollapsed: () => void;
}

interface NavigationItem {
  label: string;

  icon: ComponentType<{
    size?: number;
    className?: string;
  }>;

  href?: string;

  disabled?: boolean;

  children?: NavigationItem[];
}

interface NavigationSection {
  title: string;
  requiredModule?: string;

  items: NavigationItem[];
}

const navigationSections: NavigationSection[] = [
  {
    title: "Main",

    items: [
      {
        href: "/dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
      },
    ],
  },

  {
    title: "Sales & CRM",
    requiredModule: "sales",

    items: [
      {
        label: "CRM",
        icon: Target,

        children: [
          {
            href: "/customers",
            label: "Customers",
            icon: Users,
          },

          {
            href: "/leads",
            label: "Leads",
            icon: UserRound,
          },

          {
            href: "/opportunities",
            label: "Opportunities",
            icon: Handshake,
          },

          {
            href: "/pipeline",
            label: "Pipeline",
            icon: BarChart3,
          },
        ],
      },

      {
        label: "Quotations",
        icon: FileText,
        disabled: true,
      },

      {
        label: "Sales Orders",
        icon: ClipboardList,
        disabled: true,
      },

      {
        label: "Invoices",
        icon: ReceiptText,
        disabled: true,
      },

      {
        label: "Payments",
        icon: CircleDollarSign,
        disabled: true,
      },
    ],
  },

  {
    title: "Inventory",

    items: [
      {
        label: "Products",
        icon: Package,
        disabled: true,
      },

      {
        label: "Inventory",
        icon: Boxes,
        disabled: true,
      },

      {
        label: "Warehouses",
        icon: Warehouse,
        disabled: true,
      },

      {
        label: "Stock Movements",
        icon: Truck,
        disabled: true,
      },
    ],
  },

  {
    title: "Procurement",

    items: [
      {
        label: "Suppliers",
        icon: Building2,
        disabled: true,
      },

      {
        label: "Purchase Orders",
        icon: ShoppingCart,
        disabled: true,
      },

      {
        label: "Goods Receipts",
        icon: ClipboardList,
        disabled: true,
      },
    ],
  },

  {
    title: "Self Service",

    items: [
      {
        href: "/profile",
        label: "My Profile",
        icon: UserRound,
      },
    ],
  },

  {
    title: "Administration",
    requiredModule: "admin",

    items: [
      {
        href: "/users",
        label: "Manage Users",
        icon: Users,
      },

      {
        href: "/settings/company",
        label: "Company Settings",
        icon: Settings,
      },

      {
        href: "/settings/smtp",
        label: "SMTP Settings",
        icon: Mail,
      },

      {
        label: "Sales Settings",
        icon: Gauge,
        disabled: true,
      },
    ],
  },
];

export function Sidebar({
  open,
  collapsed,
  company,
  onClose,
  onToggleCollapsed,
}: SidebarProps) {
  const pathname = usePathname();
  const [license, setLicense] = useState<LicenseSummary | null>(null);

  useEffect(() => setLicense(getStoredLicense()), []);

  const logoUrl = resolveMediaUrl(company?.logoUrl);

  const crmActive =
    pathname.startsWith("/customers") ||
    pathname.startsWith("/leads") ||
    pathname.startsWith("/opportunities") ||
    pathname.startsWith("/pipeline");

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {
      CRM: crmActive,
    },
  );

  useEffect(() => {
    if (crmActive) {
      setExpandedGroups((current) => ({
        ...current,
        CRM: true,
      }));
    }
  }, [crmActive]);

  function toggleGroup(label: string): void {
    /*
     * If the sidebar is collapsed, clicking a group such as CRM
     * should expand the sidebar first and reveal its children.
     */
    if (collapsed) {
      setExpandedGroups((current) => ({
        ...current,
        [label]: true,
      }));

      onToggleCollapsed();

      return;
    }

    /*
     * Normal expanded-sidebar behaviour:
     * toggle the child menu open/closed.
     */
    setExpandedGroups((current) => ({
      ...current,
      [label]: !current[label],
    }));
  }

  function closeDesktopFlyouts(): void {
    if (!collapsed) {
      return;
    }

    setExpandedGroups((current) => ({
      ...current,
      CRM: crmActive,
    }));
  }

  return (
    <>
      {open ? (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-slate-950/55 lg:hidden"
        />
      ) : null}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-40 flex flex-col bg-[#1e2b3f] text-slate-200 shadow-xl transition-[width,transform] duration-200 lg:translate-x-0",
          collapsed ? "w-70 lg:w-18" : "w-70",
          open ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <SidebarHeader
          collapsed={collapsed}
          company={company}
          logoUrl={logoUrl}
          onClose={onClose}
        />

        <button
          type="button"
          onClick={onToggleCollapsed}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="
          absolute
          -right-3.5
          top-17.5
          z-50
          hidden
          h-5
          w-6
          -translate-y-1/2
          items-center
          justify-center
          rounded-full
          border
          border-slate-600
          bg-[#1e2b3f]
          text-slate-300
          shadow-md
          transition-all
          duration-200
          hover:border-blue-500
          hover:bg-blue-600
          hover:text-white
          hover:shadow-lg
          focus:outline-none
          focus:ring-2
          focus:ring-blue-400
          focus:ring-offset-1
          focus:ring-offset-[#1e2b3f]
          lg:flex
        "
        >
          {collapsed ? (
            <ChevronRight size={15} strokeWidth={2.2} />
          ) : (
            <ChevronLeft size={15} strokeWidth={2.2} />
          )}
        </button>

        <nav
          className="sidebar-scrollbar flex-1 overflow-y-auto overflow-x-visible px-2 py-4"
          onMouseLeave={closeDesktopFlyouts}
        >
          {navigationSections
            .filter(
              (section) =>
                !section.requiredModule ||
                license?.licensedModules.includes(section.requiredModule),
            )
            .map((section, sectionIndex) => (
              <NavigationSectionBlock
                key={section.title}
                section={section}
                sectionIndex={sectionIndex}
                pathname={pathname}
                collapsed={collapsed}
                expandedGroups={expandedGroups}
                onToggleGroup={toggleGroup}
                onNavigate={onClose}
              />
            ))}
        </nav>

        <SidebarFooter collapsed={collapsed} license={license} />
      </aside>
    </>
  );
}

function SidebarHeader({
  collapsed,
  company,
  logoUrl,
  onClose,
}: {
  collapsed: boolean;

  company: Company | null;

  logoUrl: string | null;

  onClose: () => void;
}) {
  return (
    <div
      className={[
        "flex min-h-20 items-center border-b border-white/5 py-3",
        collapsed
          ? "justify-between px-4 lg:justify-center lg:px-2"
          : "justify-between px-4",
      ].join(" ")}
    >
      <Link
        href="/dashboard"
        onClick={onClose}
        title={collapsed ? (company?.name ?? "ERP Platform") : undefined}
        className={[
          "flex min-w-0 items-center gap-3",
          collapsed ? "lg:justify-center" : "",
        ].join(" ")}
      >
        <div
          className={[
            "flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl",
            logoUrl ? "bg-white" : "bg-blue-600",
          ].join(" ")}
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={`${company?.name ?? "Company"} logo`}
              className="h-full w-full object-cover"
            />
          ) : (
            <Package size={21} className="text-white" />
          )}
        </div>

        <div className={["min-w-0", collapsed ? "lg:hidden" : ""].join(" ")}>
          <p className="truncate text-sm font-semibold text-white">
            {company?.name ?? "ERP Platform"}
          </p>

          <p className="mt-0.5 truncate text-[11px] text-slate-400">
            {company ? `${company.code} workspace` : "Business management"}
          </p>
        </div>
      </Link>

      <button
        type="button"
        onClick={onClose}
        aria-label="Close navigation"
        className="rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-white lg:hidden"
      >
        <X size={18} />
      </button>
    </div>
  );
}

function NavigationSectionBlock({
  section,
  sectionIndex,
  pathname,
  collapsed,
  expandedGroups,
  onToggleGroup,
  onNavigate,
}: {
  section: NavigationSection;

  sectionIndex: number;

  pathname: string;

  collapsed: boolean;

  expandedGroups: Record<string, boolean>;

  onToggleGroup: (label: string) => void;

  onNavigate: () => void;
}) {
  return (
    <div className={sectionIndex === 0 ? "" : "mt-6"}>
      <p
        className={[
          "mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500",
          collapsed ? "lg:hidden" : "",
        ].join(" ")}
      >
        {section.title}
      </p>

      {collapsed && sectionIndex > 0 ? (
        <div className="mx-2 mb-3 hidden border-t border-white/5 lg:block" />
      ) : null}

      <div className="space-y-0.5">
        {section.items.map((item) => (
          <SidebarItem
            key={item.label}
            item={item}
            pathname={pathname}
            collapsed={collapsed}
            expanded={expandedGroups[item.label] ?? false}
            onToggle={() => onToggleGroup(item.label)}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </div>
  );
}

function SidebarItem({
  item,
  pathname,
  collapsed,
  expanded,
  onToggle,
  onNavigate,
  nested = false,
}: {
  item: NavigationItem;

  pathname: string;

  collapsed: boolean;

  expanded: boolean;

  onToggle: () => void;

  onNavigate: () => void;

  nested?: boolean;
}) {
  const Icon = item.icon;

  const hasChildren = Boolean(item.children?.length);

  const childActive =
    item.children?.some((child) =>
      child.href ? isPathActive(pathname, child.href) : false,
    ) ?? false;

  const active = item.href ? isPathActive(pathname, item.href) : childActive;

  if (hasChildren) {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={onToggle}
          title={collapsed ? item.label : undefined}
          aria-expanded={expanded}
          className={[
            "relative flex w-full items-center rounded-md py-2.5 text-sm transition",
            collapsed ? "gap-3 px-3 lg:justify-center lg:px-2" : "gap-3 px-3",
            active
              ? "bg-blue-600/15 text-white"
              : "text-slate-300 hover:bg-white/5 hover:text-white",
          ].join(" ")}
        >
          {active ? (
            <span className="absolute inset-y-1 left-0 w-0.5 rounded-r bg-blue-500" />
          ) : null}

          <Icon
            size={collapsed ? 18 : 17}
            className={active ? "text-blue-400" : "text-slate-400"}
          />

          <span
            className={[
              "min-w-0 flex-1 truncate text-left",
              collapsed ? "lg:hidden" : "",
            ].join(" ")}
          >
            {item.label}
          </span>

          <span className={collapsed ? "lg:hidden" : ""}>
            {expanded ? (
              <ChevronDown size={15} className="text-slate-500" />
            ) : (
              <ChevronRight size={15} className="text-slate-500" />
            )}
          </span>
        </button>

        {expanded ? (
          <>
            <div
              className={[
                "mt-0.5 space-y-0.5",
                collapsed ? "lg:hidden" : "",
              ].join(" ")}
            >
              {item.children?.map((child) => (
                <SidebarItem
                  key={child.label}
                  item={child}
                  pathname={pathname}
                  collapsed={false}
                  expanded={false}
                  onToggle={() => {}}
                  onNavigate={onNavigate}
                  nested
                />
              ))}
            </div>
          </>
        ) : null}
      </div>
    );
  }

  if (item.disabled || !item.href) {
    return (
      <div
        title={item.disabled ? `${item.label} — Coming soon` : item.label}
        className={[
          "group flex cursor-not-allowed items-center rounded-md py-2.5 text-sm text-slate-500",
          collapsed ? "gap-3 px-3 lg:justify-center lg:px-2" : "gap-3 px-3",
          nested ? "ml-6" : "",
        ].join(" ")}
      >
        <Icon size={collapsed ? 17 : 16} className="shrink-0 text-slate-600" />

        <span
          className={[
            "min-w-0 flex-1 truncate",
            collapsed ? "lg:hidden" : "",
          ].join(" ")}
        >
          {item.label}
        </span>

        {!collapsed ? (
          <span className="text-[9px] uppercase tracking-wide text-slate-600 opacity-0 transition group-hover:opacity-100">
            Soon
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      className={[
        "relative flex items-center rounded-md py-2.5 text-sm transition",
        collapsed ? "gap-3 px-3 lg:justify-center lg:px-2" : "gap-3 px-3",
        nested ? "ml-6" : "",
        active
          ? "bg-blue-600/15 text-white"
          : "text-slate-300 hover:bg-white/5 hover:text-white",
      ].join(" ")}
    >
      {active ? (
        <span className="absolute inset-y-1 left-0 w-0.5 rounded-r bg-blue-500" />
      ) : null}

      <Icon
        size={collapsed ? 18 : 16}
        className={[
          "shrink-0",
          active ? "text-blue-400" : "text-slate-400",
        ].join(" ")}
      />

      <span
        className={[
          "min-w-0 flex-1 truncate",
          collapsed ? "lg:hidden" : "",
        ].join(" ")}
      >
        {item.label}
      </span>
    </Link>
  );
}

function SidebarFooter({
  collapsed,
  license,
}: {
  collapsed: boolean;
  license: LicenseSummary | null;
}) {
  return (
    <div
      className={[
        "border-t border-white/5 py-3",
        collapsed ? "px-2" : "px-4",
      ].join(" ")}
    >
      <div
        className={[
          "flex items-center",
          collapsed ? "justify-center" : "gap-3",
        ].join(" ")}
      >
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-semibold text-white ring-1 ring-white/10"
          title="ERP Platform"
        >
          ERP
        </div>

        <div className={collapsed ? "hidden" : ""}>
          <p className="text-[10px] font-medium text-slate-400">ERP Platform</p>

          <p className="mt-0.5 text-[9px] text-slate-600">v1.0.0</p>
          {license && license.status !== "valid" ? (
            <p className="mt-1 text-[9px] uppercase text-amber-400">
              License: {license.status.replace("_", " ")}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function isPathActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
