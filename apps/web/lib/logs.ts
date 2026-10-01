import { apiRequest } from "@/lib/api";

export type LogTab = "activity" | "audit" | "inventory" | "system" | "mail";

export interface LogLedgerRow {
  id: string;
  timestamp: string;
  userName: string | null;
  designation: string | null;
  photoUrl: string | null;
  action: string;
  details: string | null;
  ipAddress: string | null;
  recipient: string | null;
  subject: string | null;
  qtyChange: number | null;
}

export interface LogLedger {
  tab: LogTab;
  total: number;
  page: number;
  totalPages: number;
  rows: LogLedgerRow[];
}

export function getLogLedger(query: {
  tab: LogTab;
  search?: string;
  page?: number;
}): Promise<LogLedger> {
  const params = new URLSearchParams({ tab: query.tab, page: String(query.page ?? 1) });
  if (query.search?.trim()) params.set("search", query.search.trim());
  return apiRequest<LogLedger>(`/audit-logs/ledger?${params.toString()}`);
}
