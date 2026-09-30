import { formatCurrency } from "@/lib/currency";
import type { ProformaCurrency } from "@/types/proforma-invoices";

export function formatPiAmount(
  value: string | number,
  currency: ProformaCurrency,
): string {
  const amount = Number(value);
  const safe = Number.isFinite(amount) ? amount : 0;
  if (currency === "USD") {
    return `USD ${safe.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
  return formatCurrency(safe);
}

export function customerFirstLine(value: string | null | undefined): string {
  const line = (value ?? "").split(/\r?\n/)[0]?.trim();
  return line || "N/A";
}
