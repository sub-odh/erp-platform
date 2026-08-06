import { apiRequest } from "@/lib/api";
import type {
  Organization,
  UpdateOrganizationInput,
} from "@/types/organization";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

const API_ORIGIN = API_BASE_URL.replace(/\/api\/v1\/?$/, "");

export function getCurrentOrganization() {
  return apiRequest<Organization>("/organizations/current");
}

export function updateCurrentOrganization(payload: UpdateOrganizationInput) {
  return apiRequest<Organization>("/organizations/current", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function uploadOrganizationLogo(file: File) {
  const formData = new FormData();

  formData.append("file", file);

  return apiRequest<Organization>("/organizations/current/logo", {
    method: "POST",
    body: formData,
  });
}

export function removeOrganizationLogo() {
  return apiRequest<Organization>("/organizations/current/logo", {
    method: "DELETE",
  });
}

export function resolveMediaUrl(
  value: string | null | undefined,
): string | null {
  if (!value) {
    return null;
  }

  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:")
  ) {
    return value;
  }

  return `${API_ORIGIN}${value.startsWith("/") ? value : `/${value}`}`;
}
