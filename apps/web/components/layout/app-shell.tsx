"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { AUTH_SESSION_EXPIRED_EVENT, getAccessToken } from "@/lib/auth";
import { getCurrentOrganization, resolveMediaUrl } from "@/lib/organizations";
import type { Organization } from "@/types/organization";

import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

const SIDEBAR_COLLAPSED_KEY = "erp.sidebar.collapsed";

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [organization, setOrganization] = useState<Organization | null>(null);

  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY);

    setSidebarCollapsed(stored === "true");
  }, []);

  useEffect(() => {
    let active = true;

    function routeToLogin(): void {
      router.replace("/login");
    }

    async function initialize(): Promise<void> {
      if (!getAccessToken()) {
        routeToLogin();

        return;
      }

      try {
        const result = await getCurrentOrganization();

        if (active) {
          setOrganization(result);
        }
      } catch {
        // Keep shell usable with fallback branding.
      } finally {
        if (active) {
          setReady(true);
        }
      }
    }

    void initialize();

    function handleOrganizationUpdated(event: Event): void {
      const customEvent = event as CustomEvent<Organization>;

      setOrganization(customEvent.detail);
    }

    window.addEventListener(
      "erp:organization-updated",
      handleOrganizationUpdated,
    );

    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, routeToLogin);

    return () => {
      active = false;

      window.removeEventListener(
        "erp:organization-updated",
        handleOrganizationUpdated,
      );

      window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, routeToLogin);
    };
  }, [router]);

  useEffect(() => {
    updateBrowserBranding(organization);
  }, [organization, pathname]);

  function toggleSidebarCollapsed(): void {
    setSidebarCollapsed((current) => {
      const next = !current;

      window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));

      return next;
    });
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-sm text-slate-500">Loading workspace...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Sidebar
        open={sidebarOpen}
        collapsed={sidebarCollapsed}
        organization={organization}
        onClose={() => setSidebarOpen(false)}
        onToggleCollapsed={toggleSidebarCollapsed}
      />

      <div
        className={[
          "min-h-screen transition-[padding] duration-200",
          sidebarCollapsed ? "lg:pl-18" : "lg:pl-70",
        ].join(" ")}
      >
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

function updateBrowserBranding(organization: Organization | null): void {
  if (typeof document === "undefined") {
    return;
  }

  const organizationName = organization?.name?.trim() || "ERP Platform";

  /*
   * Browser tab:
   *
   * XYZ
   *
   * rather than:
   * XYZ - Business workspace
   */
  document.title = organizationName;

  const logoUrl = resolveMediaUrl(organization?.logoUrl);

  if (!logoUrl) {
    return;
  }

  /*
   * Next.js can insert its own favicon link.
   * Update every existing icon reference so the browser
   * cannot keep selecting an older/default favicon.
   */
  const existingIcons = Array.from(
    document.querySelectorAll<HTMLLinkElement>(
      'link[rel="icon"], link[rel="shortcut icon"]',
    ),
  );

  const faviconUrl = addFaviconCacheBuster(logoUrl, organization?.updatedAt);

  if (existingIcons.length > 0) {
    existingIcons.forEach((icon) => {
      icon.href = faviconUrl;
    });
  } else {
    const favicon = document.createElement("link");

    favicon.rel = "icon";

    favicon.href = faviconUrl;

    document.head.appendChild(favicon);
  }

  let shortcutIcon = document.querySelector<HTMLLinkElement>(
    'link[data-erp-shortcut-icon="true"]',
  );

  if (!shortcutIcon) {
    shortcutIcon = document.createElement("link");

    shortcutIcon.rel = "shortcut icon";

    shortcutIcon.setAttribute("data-erp-shortcut-icon", "true");

    document.head.appendChild(shortcutIcon);
  }

  shortcutIcon.href = faviconUrl;
}

function addFaviconCacheBuster(
  url: string,
  updatedAt: string | undefined,
): string {
  const separator = url.includes("?") ? "&" : "?";

  return `${url}${separator}favicon=${encodeURIComponent(
    updatedAt ?? String(Date.now()),
  )}`;
}
