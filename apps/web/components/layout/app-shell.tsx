"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { restoreSession } from "@/lib/api";
import { AUTH_SESSION_EXPIRED_EVENT } from "@/lib/auth";
import { CalendarSystemProvider } from "@/lib/calendar-system";
import { getCurrentCompany } from "@/lib/company";
import { useAuthenticatedMediaUrl } from "@/lib/media";
import type { Company } from "@/types/company";

import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

const SIDEBAR_COLLAPSED_KEY = "erp.sidebar.collapsed";

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [company, setCompany] = useState<Company | null>(null);

  const [ready, setReady] = useState(false);

  const faviconUrl = useAuthenticatedMediaUrl(company?.faviconUrl);

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
      const signedIn = await restoreSession();

      if (!signedIn) {
        routeToLogin();

        return;
      }

      try {
        const result = await getCurrentCompany();

        if (active) {
          setCompany(result);
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

    function handleCompanyUpdated(event: Event): void {
      const customEvent = event as CustomEvent<Company>;

      setCompany(customEvent.detail);
    }

    window.addEventListener("erp:company-updated", handleCompanyUpdated);

    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, routeToLogin);

    return () => {
      active = false;

      window.removeEventListener("erp:company-updated", handleCompanyUpdated);

      window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, routeToLogin);
    };
  }, [router]);

  useEffect(() => {
    updateBrowserBranding(company, faviconUrl);
  }, [company, faviconUrl, pathname]);

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
    <CalendarSystemProvider>
      <div className="min-h-screen bg-slate-100">
        <Sidebar
          open={sidebarOpen}
          collapsed={sidebarCollapsed}
          company={company}
          onClose={() => setSidebarOpen(false)}
          onToggleCollapsed={toggleSidebarCollapsed}
        />

        <div
          className={[
            "flex min-h-screen flex-col transition-[padding] duration-200",
            sidebarCollapsed ? "lg:pl-18" : "lg:pl-70",
          ].join(" ")}
        >
          <Topbar onMenuClick={() => setSidebarOpen(true)} />

          <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>

          <footer
            data-app-footer
            className="border-t border-slate-200 bg-white px-6 py-5 text-center text-sm text-slate-600"
          >
            © {new Date().getFullYear()} EMSPro | Powered by Leapfuse
            Technology Pvt. Ltd.
          </footer>
        </div>
      </div>
    </CalendarSystemProvider>
  );
}

function updateBrowserBranding(
  company: Company | null,
  faviconImageUrl: string | null,
): void {
  if (typeof document === "undefined") {
    return;
  }

  const companyName = company?.name?.trim() || "ERP Platform";

  /*
   * Browser tab:
   *
   * XYZ
   *
   * rather than:
   * XYZ - Business workspace
   */
  document.title = companyName;

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

  const faviconUrl = faviconImageUrl
    ? addFaviconCacheBuster(faviconImageUrl, company?.updatedAt)
    : createInitialsFavicon(companyName);

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

function createInitialsFavicon(companyName: string): string {
  const initials = companyName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("") || "E";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#2563eb"/><text x="32" y="40" text-anchor="middle" font-family="Arial,sans-serif" font-size="26" font-weight="700" fill="white">${initials}</text></svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
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
