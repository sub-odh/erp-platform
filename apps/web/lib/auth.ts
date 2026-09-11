import type { AuthUser, LicenseSummary, LoginResponse } from "@/types/auth";

const ACCESS_TOKEN_KEY = "erp.accessToken";
const REFRESH_TOKEN_KEY = "erp.refreshToken";
const USER_KEY = "erp.user";
const LICENSE_KEY = "erp.license";

export const AUTH_SESSION_EXPIRED_EVENT = "erp:auth-session-expired";

export const AUTH_USER_CHANGED_EVENT = "erp:auth-user-changed";

let accessToken: string | null = null;

export function saveAuthSession(response: LoginResponse): void {
  if (typeof window === "undefined") {
    return;
  }

  accessToken = response.accessToken;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.setItem(USER_KEY, JSON.stringify(response.user));
  localStorage.setItem(LICENSE_KEY, JSON.stringify(response.license));

  notifyAuthUserChanged();
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  const value = localStorage.getItem(USER_KEY);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as AuthUser;
  } catch {
    clearAuthSession();

    return null;
  }
}

export function getStoredLicense(): LicenseSummary | null {
  if (typeof window === "undefined") return null;
  const value = localStorage.getItem(LICENSE_KEY);
  if (!value) return null;
  try {
    return JSON.parse(value) as LicenseSummary;
  } catch {
    localStorage.removeItem(LICENSE_KEY);
    return null;
  }
}

export function updateStoredUser(updates: Partial<AuthUser>): AuthUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  const currentUser = getStoredUser();

  if (!currentUser) {
    return null;
  }

  const updatedUser: AuthUser = {
    ...currentUser,
    ...updates,
  };

  localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));

  notifyAuthUserChanged();

  return updatedUser;
}

export function clearAuthSession(): void {
  accessToken = null;

  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(LICENSE_KEY);

  notifyAuthUserChanged();
}

export function expireAuthSession(): void {
  if (typeof window === "undefined") {
    return;
  }

  clearAuthSession();

  window.dispatchEvent(new Event(AUTH_SESSION_EXPIRED_EVENT));
}

function notifyAuthUserChanged(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(AUTH_USER_CHANGED_EVENT));
}
