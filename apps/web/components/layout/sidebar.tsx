"use client";

import { ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { AuthenticatedImage } from "@/components/media";
import {
  AUTH_USER_CHANGED_EVENT,
  getStoredLicense,
  getStoredUser,
} from "@/lib/auth";
import type { LicenseSummary, UserRole } from "@/types/auth";
import type { Company } from "@/types/company";

import {
  navigationSections,
  type NavigationItem,
  type NavigationSection,
} from "./sidebar-nav";

interface SidebarProps {
  open: boolean;
  collapsed: boolean;

  company: Company | null;

  onClose: () => void;

  onToggleCollapsed: () => void;
}

/*
 * Every navigation row, top level, expandable group and nested child,
 * shares this typography so each label renders at the same size as Dashboard.
 */
const navRowClass = "py-2.5 text-sm leading-5";

function isLicensed(
  requiredModule: string | undefined,
  licensedModules: string[],
): boolean {
  return !requiredModule || licensedModules.includes(requiredModule);
}

function isRoleAllowed(
  roles: UserRole[] | undefined,
  role: UserRole | null,
): boolean {
  if (!roles) {
    return true;
  }

  if (!role) {
    return false;
  }

  return roles.includes(role);
}

function visibleSections(
  licensedModules: string[],
  role: UserRole | null,
): NavigationSection[] {
  return navigationSections
    .filter(
      (section) =>
        isLicensed(section.requiredModule, licensedModules) &&
        isRoleAllowed(section.roles, role),
    )
    .map((section) => ({
      ...section,
      items: section.items
        .filter(
          (item) =>
            isLicensed(item.requiredModule, licensedModules) &&
            isRoleAllowed(item.roles, role),
        )
        .map((item) => {
          if (!item.children) {
            return item;
          }

          return {
            ...item,
            children: item.children.filter(
              (child) =>
                isLicensed(child.requiredModule, licensedModules) &&
                isRoleAllowed(child.roles, role),
            ),
          };
        })
        .filter((item) => !item.children || item.children.length > 0),
    }))
    .filter((section) => section.items.length > 0);
}

export function Sidebar({
  open,
  collapsed,
  company,
  onClose,
  onToggleCollapsed,
}: SidebarProps) {
  const pathname = usePathname();
  const [license, setLicense] = useState<LicenseSummary | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);

  useEffect(() => {
    setLicense(getStoredLicense());
    setRole(getStoredUser()?.role ?? null);

    function syncSession(): void {
      setLicense(getStoredLicense());
      setRole(getStoredUser()?.role ?? null);
    }

    window.addEventListener(AUTH_USER_CHANGED_EVENT, syncSession);
    return () =>
      window.removeEventListener(AUTH_USER_CHANGED_EVENT, syncSession);
  }, []);

  const logoUrl = company?.logoUrl ?? company?.invoiceLogoUrl ?? null;

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {},
  );

  useEffect(() => {
    const open = activeGroupKeys(pathname);

    if (Object.keys(open).length === 0) {
      return;
    }

    setExpandedGroups((current) => ({ ...current, ...open }));
  }, [pathname]);

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

    setExpandedGroups(activeGroupKeys(pathname));
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
          {visibleSections(license?.licensedModules ?? [], role).map(
            (section, sectionIndex) => (
              <NavigationSectionBlock
                key={section.id}
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
        "flex min-h-16 items-center border-b border-white/5 px-4 py-3",
        collapsed ? "lg:justify-center lg:px-2" : "justify-between",
      ].join(" ")}
    >
      <Link
        href="/dashboard"
        onClick={onClose}
        title={collapsed ? "EMS Pro" : undefined}
        className="min-w-0"
      >
        {logoUrl ? (
          <AuthenticatedImage
            src={logoUrl}
            alt={`${company?.name ?? "Company"} logo`}
            className={[
              "object-contain",
              collapsed ? "h-8 w-8 lg:h-8 lg:w-8" : "max-h-[45px] w-full",
            ].join(" ")}
          />
        ) : (
          <p
            className={[
              "m-0 text-base font-bold text-white",
              collapsed ? "lg:text-xs" : "",
            ].join(" ")}
          >
            EMS <span className="text-[#3b82f6]">Pro</span>
          </p>
        )}
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
    <div className={sectionIndex === 0 || !section.title ? "" : "mt-6"}>
      {section.title ? (
        <p
          className={[
            "mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500",
            collapsed ? "lg:hidden" : "",
          ].join(" ")}
        >
          {section.title}
        </p>
      ) : null}

      {collapsed && sectionIndex > 0 ? (
        <div className="mx-2 mb-3 hidden border-t border-white/5 lg:block" />
      ) : null}

      <div className="space-y-0.5">
        {section.items.map((item) => {
          const groupKey = `${section.id}:${item.label}`;

          return (
            <SidebarItem
              key={groupKey}
              item={item}
              pathname={pathname}
              collapsed={collapsed}
              expanded={expandedGroups[groupKey] ?? false}
              onToggle={() => onToggleGroup(groupKey)}
              onNavigate={onNavigate}
            />
          );
        })}
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
            `relative flex w-full items-center rounded-md transition ${navRowClass}`,
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
            size={collapsed ? 18 : 16}
            className={[
              "shrink-0",
              active ? "text-blue-400" : "text-slate-400",
            ].join(" ")}
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

  if (!item.href) {
    return null;
  }

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      className={[
        `relative flex items-center rounded-md transition ${navRowClass}`,
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

const EXACT_ACTIVE_PATHS = new Set([
  "/inventory",
  "/purchase-orders",
  "/delivery-orders",
  "/quotations",
  "/proforma-invoices",
  "/sales-reports",
  "/hr/memos",
  "/hr/support-visits",
]);

function activeGroupKeys(pathname: string): Record<string, boolean> {
  const open: Record<string, boolean> = {};

  for (const section of navigationSections) {
    for (const item of section.items) {
      const matches = item.children?.some((child) =>
        child.href ? isPathActive(pathname, child.href) : false,
      );

      if (matches) {
        open[`${section.id}:${item.label}`] = true;
      }
    }
  }

  return open;
}

function isPathActive(pathname: string, href: string): boolean {
  if (EXACT_ACTIVE_PATHS.has(href)) {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
