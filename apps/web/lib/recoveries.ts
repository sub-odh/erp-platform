import { apiRequest } from "@/lib/api";

export interface RecoveryRow {
  id: string;
  deliveryNumber: string;
  customerName: string;
  createdAt: string;
  invoiceNumber: string;
  balance: number;
  status: "Pending" | "Partial" | "Paid";
  voided: boolean;
  agingDays: number;
}

export interface RecoveryList {
  outstanding: number;
  counts: { Pending: number; Partial: number; Paid: number };
  totalRows: number;
  totalPages: number;
  page: number;
  limit: number;
  canCollect: boolean;
  items: RecoveryRow[];
}

export interface StatementPayment {
  paidAt: string;
  method: string;
  referenceNumber: string;
  amount: string;
}

export interface RecoveryStatement {
  companyName: string;
  companyAddress: string;
  taxNumber: string;
  logoUrl: string | null;
  deliveryNumber: string;
  invoiceNumber: string;
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  customerTaxNumber: string;
  invoicedAmount: number;
  receivedAmount: number;
  balance: number;
  paid: boolean;
  payments: StatementPayment[];
}

export function getRecoveries(params: {
  search?: string;
  status?: string;
  sort?: string;
  order?: string;
  page?: number;
  limit?: number;
}): Promise<RecoveryList> {
  const search = new URLSearchParams();
  if (params.search) search.set("search", params.search);
  if (params.status) search.set("status", params.status);
  if (params.sort) search.set("sort", params.sort);
  if (params.order) search.set("order", params.order);
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  const query = search.toString();
  return apiRequest(`/sales/recoveries${query ? `?${query}` : ""}`);
}

export function exportRecoveries(params: {
  search?: string;
  status?: string;
  sort?: string;
  order?: string;
}): Promise<{ filename: string; csv: string }> {
  const search = new URLSearchParams();
  if (params.search) search.set("search", params.search);
  if (params.status) search.set("status", params.status);
  if (params.sort) search.set("sort", params.sort);
  if (params.order) search.set("order", params.order);
  const query = search.toString();
  return apiRequest(`/sales/recoveries/export${query ? `?${query}` : ""}`);
}

export function collectRecovery(
  id: string,
  body: { amount: number; method: string; reference?: string; paymentDate: string },
): Promise<{ success: boolean }> {
  return apiRequest(`/sales/recoveries/${id}/payments`, { method: "POST", body: JSON.stringify(body) });
}

export function voidRecovery(id: string, password: string): Promise<{ success: boolean; message: string }> {
  return apiRequest(`/sales/recoveries/${id}/void`, { method: "POST", body: JSON.stringify({ password }) });
}

export function remindRecovery(id: string): Promise<{ success: boolean; message: string }> {
  return apiRequest(`/sales/recoveries/${id}/reminder`, { method: "POST" });
}

export function getRecoveryStatement(id: string): Promise<RecoveryStatement> {
  return apiRequest(`/sales/recoveries/${id}/statement`);
}
