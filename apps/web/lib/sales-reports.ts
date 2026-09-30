import { apiRequest } from "@/lib/api";

export interface MonthAmounts {
  jan: number;
  feb: number;
  mar: number;
  apr: number;
  may: number;
  jun: number;
  jul: number;
  aug: number;
  sep: number;
  oct: number;
  nov: number;
  dec: number;
}

export interface TrendPoint {
  key: string;
  label: string;
  invoiced: number;
  won: number;
}

export interface StaffPerformance {
  id: string;
  firstName: string;
  salesTarget: number;
  targetStartDate: string | null;
  targetEndDate: string | null;
  amount: number;
  months: MonthAmounts;
  effectiveTarget: number;
}

export interface SalesTrendReport {
  startDate: string;
  endDate: string;
  revenue: number;
  invoiceCount: number;
  wonTotal: number;
  revenueMonths: MonthAmounts;
  orderMonths: MonthAmounts;
  wonMonths: MonthAmounts;
  trend: TrendPoint[];
  staffInvoices: StaffPerformance[];
  staffWon: StaffPerformance[];
}

export interface InvoiceBreakdownRow {
  id: string;
  deliveryDate: string;
  customerName: string;
  deliveryNumber: string;
  grandTotal: string;
  items: string[];
}

export interface WonBreakdownRow {
  updatedAt: string;
  companyName: string;
  contactPerson: string;
  dealValue: string;
  dealRemarks: string;
}

export interface TargetEmployee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  designation: string;
  department: string;
  salesTarget: number;
  yearlySalesTarget: number;
  monthlyAchieved: number;
  yearlyAchieved: number;
  monthlyPct: number;
  yearlyPct: number;
  canViewBreakdown: boolean;
}

export interface TargetReport {
  currentEmployeeId: string | null;
  canViewAll: boolean;
  employees: TargetEmployee[];
}

export interface RecoveryRow {
  deliveryNumber: string;
  invoiceDate: string | null;
  recoveryDate: string;
  method: string;
  amount: string;
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"] as const;

export function getSalesTrend(month = "all"): Promise<SalesTrendReport> {
  return apiRequest(`/sales/reports/trend?month=${encodeURIComponent(month)}`);
}

export function getInvoiceBreakdown(employeeId: string, start: string, end: string): Promise<InvoiceBreakdownRow[]> {
  return apiRequest(`/sales/reports/staff/${employeeId}/invoices?start=${start}&end=${end}`);
}

export function getWonBreakdown(employeeId: string, start: string, end: string): Promise<WonBreakdownRow[]> {
  return apiRequest(`/sales/reports/staff/${employeeId}/won?start=${start}&end=${end}`);
}

export function getTargetReport(): Promise<TargetReport> {
  return apiRequest("/sales/reports/targets");
}

export function getRecoveries(
  employeeId: string,
  range: "monthly" | "yearly",
  start = "",
  end = "",
): Promise<RecoveryRow[]> {
  const search = new URLSearchParams({ range });
  if (start) search.set("start", start);
  if (end) search.set("end", end);
  return apiRequest(`/sales/reports/targets/${employeeId}/recoveries?${search.toString()}`);
}

export function monthBounds(year: number, key: string): { start: string; end: string } {
  const month = MONTHS.indexOf(key as (typeof MONTHS)[number]) + 1;
  const padded = String(month).padStart(2, "0");
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return { start: `${year}-${padded}-01`, end: `${year}-${padded}-${String(last).padStart(2, "0")}` };
}

export function effectiveTarget(
  baseTarget: number,
  targetStartDate: string | null,
  targetEndDate: string | null,
  filterStart: string,
  filterEnd: string,
  year: number,
): number {
  if (!baseTarget || baseTarget <= 0) return 0;
  const empStart = dayNumber(targetStartDate || `${year}-01-01`);
  const empEnd = dayNumber(targetEndDate || `${year}-12-31`);
  const overlapStart = Math.max(empStart, dayNumber(filterStart));
  const overlapEnd = Math.min(empEnd, dayNumber(filterEnd));
  if (overlapStart > overlapEnd) return 0;
  const totalTargetDays = Math.max(1, empEnd - empStart + 1);
  return (baseTarget / totalTargetDays) * (overlapEnd - overlapStart + 1);
}

function dayNumber(iso: string): number {
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number);
  return Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1) / 86_400_000;
}
