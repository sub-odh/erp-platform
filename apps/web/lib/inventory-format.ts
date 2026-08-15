import type { InventoryAssetStatus } from "@/types/inventory";

export function formatRupees(value: number): string {
  return `Rs. ${new Intl.NumberFormat("en-NP", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)}`;
}

export function inventoryStatusLabel(status: InventoryAssetStatus): string {
  if (status === "POC_LOAN") return "PoC (Loan)";
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function inventoryStatusClasses(status: InventoryAssetStatus): string {
  if (
    status === "IN_STOCK" ||
    status === "RETURNED" ||
    status === "AVAILABLE" ||
    status === "IN_USE"
  ) {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }
  if (status === "SOLD" || status === "DELIVERED") {
    return "bg-blue-50 text-blue-700 ring-blue-200";
  }
  if (status === "DAMAGED" || status === "OUT_OF_STOCK") {
    return "bg-red-50 text-red-700 ring-red-200";
  }
  return "bg-amber-50 text-amber-700 ring-amber-200";
}
