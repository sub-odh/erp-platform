import { apiRequest } from "@/lib/api";
import { formatCurrency } from "@/lib/currency";
import type { DashboardOverview } from "@/types/dashboard";

export function getDashboardOverview(filters: {
  inv_month: string;
  sales_month: string;
}): Promise<DashboardOverview> {
  const params = new URLSearchParams();
  params.set("inv_month", filters.inv_month);
  params.set("sales_month", filters.sales_month);
  return apiRequest<DashboardOverview>(`/dashboard?${params.toString()}`);
}

export function postDashboardAction(body: {
  mark_back_id?: string;
  visit_remarks?: string;
  confirm_sub_id?: string;
  reject_sub_id?: string;
}): Promise<{ ok: boolean }> {
  return apiRequest("/dashboard/actions", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function formatRupees(value: number, digits = 0): string {
  return formatCurrency(value, { minimumFractionDigits: digits });
}
