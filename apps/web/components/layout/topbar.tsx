"use client";

import { LogOut, Menu } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Avatar } from "@/components/users/avatar";
import {
  AUTH_USER_CHANGED_EVENT,
  clearAuthSession,
  getStoredUser,
} from "@/lib/auth";
import type { AuthUser } from "@/types/auth";

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const router = useRouter();

  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    function syncUser(): void {
      setUser(getStoredUser());
    }

    syncUser();

    window.addEventListener(AUTH_USER_CHANGED_EVENT, syncUser);

    window.addEventListener("storage", syncUser);

    return () => {
      window.removeEventListener(AUTH_USER_CHANGED_EVENT, syncUser);

      window.removeEventListener("storage", syncUser);
    };
  }, []);

  function logout(): void {
    clearAuthSession();

    router.replace("/login");
  }

  function openProfile(): void {
    router.push("/profile");
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        className="rounded-md p-2 text-slate-600 transition hover:bg-slate-100 lg:hidden"
        aria-label="Open navigation"
      >
        <Menu size={22} />
      </button>

      <div className="hidden lg:block">
        <p className="text-sm text-slate-500">Business workspace</p>
      </div>

      <div className="flex items-center gap-2">
        {user ? (
          <button
            type="button"
            onClick={openProfile}
            className="group flex items-center gap-3 rounded-xl px-2 py-1.5 text-left transition hover:bg-slate-50"
            aria-label="Open my profile"
          >
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-slate-900 transition group-hover:text-blue-600">
                {user.firstName} {user.lastName}
              </p>

              <p className="text-xs text-slate-500">{user.role}</p>
            </div>

            <Avatar
              firstName={user.firstName}
              lastName={user.lastName}
              src={user.avatarUrl}
              size="md"
            />
          </button>
        ) : (
          <div className="h-10 w-10 rounded-full bg-slate-100" />
        )}

        <div className="mx-1 h-7 w-px bg-slate-200" />

        <button
          type="button"
          onClick={logout}
          className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
          aria-label="Log out"
          title="Log out"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
}
