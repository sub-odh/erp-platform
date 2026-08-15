import { apiRequest } from "@/lib/api";
import type {
  Company,
  CompanyBackup,
  CompanyDataOperationResult,
  UpdateCompanyInput,
} from "@/types/company";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

const API_ORIGIN = API_BASE_URL.replace(/\/api\/v1\/?$/, "");

export function getCurrentCompany() {
  return apiRequest<Company>("/company/current");
}

export function updateCurrentCompany(payload: UpdateCompanyInput) {
  return apiRequest<Company>("/company/current", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function uploadCompanyLogo(file: File) {
  const formData = new FormData();

  formData.append("file", file);

  return apiRequest<Company>("/company/current/logo", {
    method: "POST",
    body: formData,
  });
}

export function removeCompanyLogo() {
  return apiRequest<Company>("/company/current/logo", {
    method: "DELETE",
  });
}

export function uploadInvoiceLogo(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return apiRequest<Company>("/company/current/invoice-logo", {
    method: "POST",
    body: formData,
  });
}

export function removeInvoiceLogo() {
  return apiRequest<Company>("/company/current/invoice-logo", {
    method: "DELETE",
  });
}

export function uploadFavicon(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return apiRequest<Company>("/company/current/favicon", {
    method: "POST",
    body: formData,
  });
}

export function removeFavicon() {
  return apiRequest<Company>("/company/current/favicon", {
    method: "DELETE",
  });
}

export function getCompanyBackup() {
  return apiRequest<CompanyBackup>("/company/current/backup");
}

export function restoreCompanyBackup(file: File, confirmation: string) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("confirmation", confirmation);

  return apiRequest<CompanyDataOperationResult>("/company/current/restore", {
    method: "POST",
    body: formData,
  });
}

export function resetCompanyData(confirmation: string, ownerPassword: string) {
  return apiRequest<CompanyDataOperationResult>("/company/current/reset-data", {
    method: "POST",
    body: JSON.stringify({ confirmation, ownerPassword }),
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
