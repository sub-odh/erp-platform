import type { AuthUser, LoginResponse } from "@/types/auth";

const ACCESS_TOKEN_KEY = "erp.accessToken";
const REFRESH_TOKEN_KEY = "erp.refreshToken";
const USER_KEY = "erp.user";

export function saveAuthSession(response: LoginResponse): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, response.accessToken);

  localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);

  localStorage.setItem(USER_KEY, JSON.stringify(response.user));
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(REFRESH_TOKEN_KEY);
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

export function clearAuthSession(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
