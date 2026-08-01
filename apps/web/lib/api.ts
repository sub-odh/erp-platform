import { clearAuthSession, getAccessToken } from "@/lib/auth";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

interface ApiErrorResponse {
  message?: string | string[];
  statusCode?: number;
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

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const accessToken = getAccessToken();

  const headers = new Headers(options.headers);

  if (options.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new ApiError(0, `Cannot connect to API at ${API_URL}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const body = (await response.json().catch(() => null)) as
    | ApiErrorResponse
    | T
    | null;

  if (!response.ok) {
    if (response.status === 401) {
      clearAuthSession();
    }

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
