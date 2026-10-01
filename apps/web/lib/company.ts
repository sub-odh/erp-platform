import { apiRequest } from "@/lib/api";
import type {
  Company,
  CompanyBackup,
  CompanyBackupArchive,
  CompanyBackupFile,
  CompanyBackupSchedule,
  CompanyDataOperationResult,
  UpdateCompanyInput,
} from "@/types/company";

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

export function restoreCompanyBackup(
  file: File,
  confirmation: string,
  ownerPassword: string,
) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("confirmation", confirmation);
  formData.append("ownerPassword", ownerPassword);

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

export function getCompanyBackupArchive() {
  return apiRequest<CompanyBackupArchive>("/company/current/backup-archive");
}

export function updateCompanyBackupSchedule(
  schedule: Omit<CompanyBackupSchedule, "lastAutomatedRun">,
) {
  return apiRequest<CompanyBackupSchedule>(
    "/company/current/backup-archive/schedule",
    {
      method: "PATCH",
      body: JSON.stringify(schedule),
    },
  );
}

export function createCompanyBackupSnapshot() {
  return apiRequest<CompanyBackupFile>("/company/current/backup-archive", {
    method: "POST",
  });
}

export function downloadCompanyBackupFile(fileId: string) {
  return apiRequest<{ filename: string; backup: CompanyBackup }>(
    `/company/current/backup-archive/${fileId}`,
  );
}

export function deleteCompanyBackupFile(fileId: string) {
  return apiRequest<void>(`/company/current/backup-archive/${fileId}`, {
    method: "DELETE",
  });
}

export function restoreCompanyBackupFile(
  fileId: string,
  confirmation: string,
  ownerPassword: string,
) {
  return apiRequest<CompanyDataOperationResult>(
    `/company/current/backup-archive/${fileId}/restore`,
    {
      method: "POST",
      body: JSON.stringify({ confirmation, ownerPassword }),
    },
  );
}
