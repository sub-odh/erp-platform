import {
  expireAuthSession,
  getAccessToken,
  getRefreshToken,
  saveAuthSession,
} from "@/lib/auth";
import type { LoginResponse } from "@/types/auth";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

interface ApiErrorResponse {
  message?: string | string[];
  statusCode?: number;
}

interface ApiRequestOptions extends RequestInit {
  skipAuthRefresh?: boolean;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

let refreshPromise: Promise<string> | null = null;

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const response = await performRequest(path, options);

  if (
    response.status === 401 &&
    !options.skipAuthRefresh &&
    path !== "/auth/login" &&
    path !== "/auth/refresh"
  ) {
    try {
      const accessToken = await refreshAccessToken();

      const retryResponse = await performRequest(path, options, accessToken);

      return handleResponse<T>(retryResponse);
    } catch {
      expireAuthSession();

      throw new ApiError(
        401,
        "Your session has expired. Please sign in again.",
      );
    }
  }

  return handleResponse<T>(response);
}

async function performRequest(
  path: string,
  options: ApiRequestOptions,
  accessTokenOverride?: string,
): Promise<Response> {
  const fetchOptions: RequestInit = {
    ...options,
  };

  delete (fetchOptions as ApiRequestOptions).skipAuthRefresh;

  const headers = new Headers(fetchOptions.headers);

  const isFormData =
    typeof FormData !== "undefined" && fetchOptions.body instanceof FormData;

  if (
    fetchOptions.body !== undefined &&
    !isFormData &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  const accessToken = accessTokenOverride ?? getAccessToken();

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  try {
    return await fetch(`${API_URL}${path}`, {
      ...fetchOptions,
      headers,
    });
  } catch {
    throw new ApiError(0, `Cannot connect to API at ${API_URL}`);
  }
}

async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = executeRefresh();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

async function executeRefresh(): Promise<string> {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    throw new ApiError(401, "No refresh token is available");
  }

  let response: Response;

  try {
    response = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refreshToken,
      }),
    });
  } catch {
    throw new ApiError(0, `Cannot connect to API at ${API_URL}`);
  }

  if (!response.ok) {
    throw new ApiError(
      response.status,
      await readErrorMessage(response, "Unable to refresh session"),
    );
  }

  const result = (await response.json()) as LoginResponse;

  saveAuthSession(result);

  return result.accessToken;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }

  const body = (await response.json().catch(() => null)) as
    | ApiErrorResponse
    | T
    | null;

  if (!response.ok) {
    const rawMessage =
      body && typeof body === "object" && "message" in body
        ? body.message
        : `Request failed with status ${response.status}`;

    const message = Array.isArray(rawMessage)
      ? rawMessage.join(", ")
      : (rawMessage ?? `Request failed with status ${response.status}`);

    throw new ApiError(response.status, message);
  }

  return body as T;
}

async function readErrorMessage(
  response: Response,
  fallback: string,
): Promise<string> {
  try {
    const body = (await response.json()) as ApiErrorResponse;

    if (Array.isArray(body.message)) {
      return body.message.join(", ");
    }

    if (typeof body.message === "string") {
      return body.message;
    }
  } catch {
    // Use the fallback when the response body is not JSON.
  }

  return fallback;
}
