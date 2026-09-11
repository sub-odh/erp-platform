import { apiRequest } from "@/lib/api";
import { formatCurrency } from "@/lib/currency";
import type { DashboardOverview } from "@/types/dashboard";

export function getDashboardOverview(filters?: {
  invMonth?: string;
  salesMonth?: string;
  distMonth?: string;
}): Promise<DashboardOverview> {
  const params = new URLSearchParams();
  if (filters?.invMonth) params.set("invMonth", filters.invMonth);
  if (filters?.salesMonth) params.set("salesMonth", filters.salesMonth);
  if (filters?.distMonth) params.set("distMonth", filters.distMonth);
  const query = params.toString();
  return apiRequest<DashboardOverview>(
    query ? `/dashboard?${query}` : "/dashboard",
  );
}

export function formatRupees(value: number, digits = 0): string {
  return formatCurrency(value, { minimumFractionDigits: digits });
}
