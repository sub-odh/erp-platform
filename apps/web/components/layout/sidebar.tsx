"use client";

import {
  Building2,
  LayoutDashboard,
  Package,
  Settings,
  UserRound,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { resolveMediaUrl } from "@/lib/organizations";
import type { Organization } from "@/types/organization";

interface SidebarProps {
  open: boolean;
  organization: Organization | null;
  onClose: () => void;
}

const workspaceItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/settings/organization",
    label: "Organization",
    icon: Building2,
  },
  {
    href: "/users",
    label: "Users",
    icon: Users,
  },
];

const accountItems = [
  {
    href: "/profile",
    label: "My Profile",
    icon: UserRound,
  },
];

export function Sidebar({ open, organization, onClose }: SidebarProps) {
  const pathname = usePathname();

  const logoUrl = resolveMediaUrl(organization?.logoUrl);

  return (
    <>
      {open ? (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-slate-950/50 lg:hidden"
        />
      ) : null}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-40 flex w-62.5 flex-col bg-slate-900 text-slate-200 transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex min-h-20 items-center justify-between border-b border-slate-800 px-5 py-3">
          <Link
            href="/dashboard"
            className="flex min-w-0 items-center gap-3"
            onClick={onClose}
          >
            {logoUrl ? (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-800">
                <img
                  src={logoUrl}
                  alt={`${organization?.name ?? "Organization"} logo`}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600">
                <Package size={22} />
              </div>
            )}

            <div className="min-w-0">
              <p className="truncate font-semibold text-white">
                {organization?.name ?? "ERP Platform"}
              </p>

              <p className="truncate text-xs text-slate-400">
                {organization
                  ? `${organization.code} workspace`
                  : "Management system"}
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white lg:hidden"
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5">
          <NavSection
            title="Workspace"
            items={workspaceItems}
            pathname={pathname}
            onNavigate={onClose}
          />

          <div className="mt-8">
            <NavSection
              title="Account"
              items={accountItems}
              pathname={pathname}
              onNavigate={onClose}
            />
          </div>

          <div className="mt-8">
            <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Coming later
            </p>

            <div className="space-y-1 opacity-50">
              <div className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-slate-400">
                <Package size={18} />
                Inventory
              </div>

              <div className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-slate-400">
                <Settings size={18} />
                Administration
              </div>
            </div>
          </div>
        </nav>
      </aside>
    </>
  );
}

function NavSection({
  title,
  items,
  pathname,
  onNavigate,
}: {
  title: string;
  items: Array<{
    href: string;
    label: string;
    icon: React.ComponentType<{
      size?: number;
    }>;
  }>;
  pathname: string;
  onNavigate: () => void;
}) {
  return (
    <div>
      <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {title}
      </p>

      <div className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;

          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={[
                "flex items-center gap-3 rounded-md border-l-2 px-3 py-2.5 text-sm transition",
                active
                  ? "border-blue-500 bg-slate-800 text-white"
                  : "border-transparent text-slate-400 hover:bg-slate-800/70 hover:text-white",
              ].join(" ")}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
