import type { OfficeAssetStatus } from "@/types/office-asset";

export function officeStatusIsPoc(status: string): boolean {
  return status === "PoC";
}

export function officeStatusLabel(status: string): string {
  if (status === "PoC") {
    return "PoC";
  }

  return status;
}

export function officeFormStatus(status: string): OfficeAssetStatus {
  if (status === "In Use" || status === "PoC") {
    return status;
  }

  return "Available";
}
