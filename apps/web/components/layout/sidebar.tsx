"use client";

import {
  Building2,
  LayoutDashboard,
  Package,
  Settings,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const items = [
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

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

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
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-5">
          <Link
            href="/dashboard"
            className="flex items-center gap-3"
            onClick={onClose}
          >
            <div className="rounded-lg bg-blue-600 p-2">
              <Package size={20} />
            </div>

            <div>
              <p className="font-semibold text-white">ERP Platform</p>
              <p className="text-xs text-slate-400">Management system</p>
            </div>
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-slate-400 hover:bg-slate-800 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Workspace
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
                  onClick={onClose}
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

          <p className="mb-3 mt-8 px-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Coming later
          </p>

          <div className="space-y-1 opacity-50">
            <div className="flex items-center gap-3 px-3 py-2.5 text-sm">
              <Package size={18} />
              Inventory
            </div>

            <div className="flex items-center gap-3 px-3 py-2.5 text-sm">
              <Settings size={18} />
              Administration
            </div>
          </div>
        </nav>
      </aside>
    </>
  );
}
