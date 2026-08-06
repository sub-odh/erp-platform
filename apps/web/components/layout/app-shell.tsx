"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  AUTH_SESSION_EXPIRED_EVENT,
  getAccessToken,
  getRefreshToken,
} from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { getCurrentOrganization } from "@/lib/organizations";
import type { Organization } from "@/types/organization";

import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

type ShellStatus = "loading" | "ready" | "error";

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [organization, setOrganization] = useState<Organization | null>(null);

  const [status, setStatus] = useState<ShellStatus>("loading");

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    function redirectToLogin(): void {
      if (!active) {
        return;
      }

      setStatus("loading");
      router.replace("/login");
    }

    async function initialize(): Promise<void> {
      const accessToken = getAccessToken();

      const refreshToken = getRefreshToken();

      if (!accessToken && !refreshToken) {
        redirectToLogin();
        return;
      }

      setStatus("loading");
      setError(null);

      try {
        const result = await getCurrentOrganization();

        if (!active) {
          return;
        }

        setOrganization(result);
        setStatus("ready");
      } catch (requestError) {
        if (!active) {
          return;
        }

        if (requestError instanceof ApiError && requestError.status === 401) {
          redirectToLogin();
          return;
        }

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load the workspace",
        );

        setStatus("error");
      }
    }

    function handleSessionExpired(): void {
      redirectToLogin();
    }

    function handleOrganizationUpdated(event: Event): void {
      const customEvent = event as CustomEvent<Organization>;

      setOrganization(customEvent.detail);
    }

    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, handleSessionExpired);

    window.addEventListener(
      "erp:organization-updated",
      handleOrganizationUpdated,
    );

    void initialize();

    return () => {
      active = false;

      window.removeEventListener(
        AUTH_SESSION_EXPIRED_EVENT,
        handleSessionExpired,
      );

      window.removeEventListener(
        "erp:organization-updated",
        handleOrganizationUpdated,
      );
    };
  }, [router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-r-transparent" />

          <p className="mt-4 text-sm text-slate-500">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">
            Unable to load workspace
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            {error ?? "The workspace could not be loaded."}
          </p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Sidebar
        open={sidebarOpen}
        organization={organization}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="lg:pl-62.5">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
