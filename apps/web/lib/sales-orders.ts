import { apiRequest } from "@/lib/api";
import type { SalesOrderReport } from "@/types/sales-orders";

export function getSalesOrderReport(): Promise<SalesOrderReport> {
  return apiRequest("/sales/orders/report");
}
