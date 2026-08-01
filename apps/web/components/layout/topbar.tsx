"use client";

import { LogOut, Menu, UserCircle } from "lucide-react";
import { useRouter } from "next/navigation";

import { clearAuthSession, getStoredUser } from "@/lib/auth";

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const router = useRouter();
  const user = getStoredUser();

  function logout(): void {
    clearAuthSession();
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        className="rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
      >
        <Menu size={22} />
      </button>

      <div className="hidden lg:block">
        <p className="text-sm text-slate-500">Business workspace</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-slate-900">
            {user ? `${user.firstName} ${user.lastName}` : "ERP User"}
          </p>

          <p className="text-xs text-slate-500">{user?.role ?? ""}</p>
        </div>

        <UserCircle size={34} className="text-slate-400" />

        <button
          type="button"
          onClick={logout}
          className="rounded-md p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
          aria-label="Log out"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
}
