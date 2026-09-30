"use client";

import { ChevronDown } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { StaffBreakdownView } from "@/components/sales/staff-breakdown-view";
import { SalesTrendChart } from "@/components/sales/sales-trend-chart";
import { Select, Spinner } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { formatCurrency } from "@/lib/currency";
import {
  effectiveTarget,
  getSalesTrend,
  monthBounds,
  type MonthAmounts,
  type SalesTrendReport,
  type StaffPerformance,
} from "@/lib/sales-reports";

const MONTHS = [
  ["jan", "Jan"],
  ["feb", "Feb"],
  ["mar", "Mar"],
  ["apr", "Apr"],
  ["may", "May"],
  ["jun", "Jun"],
  ["jul", "Jul"],
  ["aug", "Aug"],
  ["sep", "Sep"],
  ["oct", "Oct"],
  ["nov", "Nov"],
  ["dec", "Dec"],
] as const;

const GLOBAL_MONTHS = [
  ["01", "January"],
  ["02", "February"],
  ["03", "March"],
  ["04", "April"],
  ["05", "May"],
  ["06", "June"],
  ["07", "July"],
  ["08", "August"],
  ["09", "September"],
  ["10", "October"],
  ["11", "November"],
  ["12", "December"],
] as const;

export default function SalesTrendPage() {
  const [month, setMonth] = useState("all");
  const [report, setReport] = useState<SalesTrendReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revenueMonth, setRevenueMonth] = useState("all");
  const [wonMonth, setWonMonth] = useState("all");
  const [countMonth, setCountMonth] = useState("all");
  const [invoiceMonth, setInvoiceMonth] = useState("all");
  const [crmMonth, setCrmMonth] = useState("all");
  const [detail, setDetail] = useState<{
    employee: StaffPerformance;
    kind: "invoiced" | "crm";
    amount: number;
    target: number;
    start: string;
    end: string;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setReport(await getSalesTrend(month));
      setRevenueMonth("all");
      setWonMonth("all");
      setCountMonth("all");
      setInvoiceMonth("all");
      setCrmMonth("all");
    } catch (reason: unknown) {
      setError(reason instanceof ApiError ? reason.message : "Unable to load the sales report.");
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    void load();
  }, [load]);

  const year = Number(report?.endDate.slice(0, 4) ?? new Date().getFullYear());

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-800">Sales & Pipeline Performance</h1>
        <Select value={month} className="py-1.5" onChange={(event) => setMonth(event.target.value)}>
          <option value="all">All Months (Last 12 Months)</option>
          {GLOBAL_MONTHS.map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </Select>
      </div>
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      {loading || !report ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-3">
            <Metric
              label="Total Invoiced Revenue"
              accent="border-emerald-500 text-emerald-600"
              value={money(cardValue(report.revenue, report.revenueMonths, revenueMonth))}
              month={revenueMonth}
              onMonth={setRevenueMonth}
            />
            <Metric
              label="Total Won Deals (CRM)"
              accent="border-blue-600 text-blue-700"
              value={money(cardValue(report.wonTotal, report.wonMonths, wonMonth))}
              month={wonMonth}
              onMonth={setWonMonth}
            />
            <Metric
              label="Invoices Generated"
              accent="border-cyan-500 text-cyan-700"
              value={String(cardValue(report.invoiceCount, report.orderMonths, countMonth))}
              month={countMonth}
              onMonth={setCountMonth}
              plain
            />
          </div>
          <section className="rounded-xl bg-white p-4 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold">Revenue Trend: Invoiced vs. Won Deals</h2>
            <SalesTrendChart months={report.trend} />
          </section>
          <div className="grid gap-4 lg:grid-cols-2">
            <section className="overflow-hidden rounded-xl bg-white shadow-sm">
              <header className="flex items-center justify-between px-3 py-3">
                <h2 className="text-sm font-semibold text-emerald-600">Staff Achievement (Verified Invoices)</h2>
                <MonthSelect value={invoiceMonth} tone="text-emerald-600" onChange={setInvoiceMonth} />
              </header>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500">
                    <th className="px-3 py-2">Employee</th>
                    <th className="px-3 py-2 text-right">Invoiced Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {report.staffInvoices.map((row) => {
                    const amount = staffAmount(row, invoiceMonth);
                    return (
                      <tr
                        key={row.id}
                        className="cursor-pointer border-t border-slate-100 hover:bg-emerald-50"
                        onClick={() => setDetail({
                          employee: row,
                          kind: "invoiced",
                          amount,
                          target: targetFor(row, invoiceMonth, report, year),
                          ...bounds(invoiceMonth, report, year),
                        })}
                      >
                        <td className="px-3 py-2 text-xs font-semibold text-blue-700">{row.firstName}</td>
                        <td className="px-3 py-2 text-right font-semibold text-emerald-600">{money(amount)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
            <section className="overflow-hidden rounded-xl bg-white shadow-sm">
              <header className="flex items-center justify-between px-3 py-3">
                <h2 className="text-sm font-semibold text-blue-700">Staff: Pipeline Won (CRM)</h2>
                <MonthSelect value={crmMonth} tone="text-blue-700" onChange={setCrmMonth} />
              </header>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500">
                    <th className="px-3 py-2">Employee</th>
                    <th className="py-2">Won Val</th>
                    <th className="px-3 py-2">Vs Target</th>
                  </tr>
                </thead>
                <tbody>
                  {report.staffWon.map((row) => {
                    const amount = staffAmount(row, crmMonth);
                    const target = targetFor(row, crmMonth, report, year);
                    const percent = target > 0 ? (amount / target) * 100 : 0;
                    return (
                      <tr
                        key={row.id}
                        className="cursor-pointer border-t border-slate-100 hover:bg-emerald-50"
                        onClick={() => setDetail({
                          employee: row,
                          kind: "crm",
                          amount,
                          target,
                          ...bounds(crmMonth, report, year),
                        })}
                      >
                        <td className="px-3 py-2 text-xs font-semibold text-blue-700">{row.firstName}</td>
                        <td className="py-2 text-xs font-semibold text-blue-700">{money(amount)}</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 flex-1 overflow-hidden rounded bg-slate-100">
                              <div className="h-full bg-blue-600" style={{ width: `${Math.min(percent, 100)}%` }} />
                            </div>
                            <span className="text-xs font-semibold">{Math.round(percent)}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
          </div>
        </>
      )}
      <StaffBreakdownView
        open={Boolean(detail)}
        employeeId={detail?.employee.id ?? ""}
        name={detail?.employee.firstName ?? ""}
        kind={detail?.kind ?? "invoiced"}
        target={detail?.target ?? 0}
        achieved={detail?.amount ?? 0}
        start={detail?.start ?? ""}
        end={detail?.end ?? ""}
        onClose={() => setDetail(null)}
      />
    </div>
  );
}

function Metric({
  label,
  value,
  accent,
  month,
  onMonth,
  plain = false,
}: {
  label: string;
  value: string;
  accent: string;
  month: string;
  onMonth: (value: string) => void;
  plain?: boolean;
}) {
  return (
    <div className={`rounded-xl border-l-4 bg-white p-3 shadow-sm ${accent.split(" ")[0]}`}>
      <div className="mb-1 flex items-start justify-between gap-2">
        <span className={`text-xs font-bold uppercase ${accent.split(" ").slice(1).join(" ")}`}>{label}</span>
        <MonthSelect value={month} tone={accent.split(" ").slice(1).join(" ")} onChange={onMonth} />
      </div>
      <p className="text-2xl font-semibold">{plain ? value : value}</p>
    </div>
  );
}

function MonthSelect({ value, onChange, tone }: { value: string; onChange: (value: string) => void; tone: string }) {
  return (
    <div className="relative">
      <select
        value={value}
        className={`appearance-none bg-transparent pr-4 text-xs font-bold outline-none ${tone}`}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="all">All Range</option>
        {MONTHS.map(([key, label]) => (
          <option key={key} value={key}>{label}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-0 top-1/2 size-3 -translate-y-1/2 text-slate-700" />
    </div>
  );
}

function cardValue(total: number, months: MonthAmounts, key: string): number {
  if (key === "all") return total;
  return months[key as keyof MonthAmounts] ?? 0;
}

function staffAmount(row: StaffPerformance, key: string): number {
  if (key === "all") return row.amount;
  return row.months[key as keyof MonthAmounts] ?? 0;
}

function targetFor(row: StaffPerformance, key: string, report: SalesTrendReport, year: number): number {
  if (key === "all") return row.effectiveTarget;
  const window = monthBounds(year, key);
  return effectiveTarget(row.salesTarget, row.targetStartDate, row.targetEndDate, window.start, window.end, year);
}

function bounds(key: string, report: SalesTrendReport, year: number): { start: string; end: string } {
  if (key === "all") return { start: report.startDate, end: report.endDate };
  return monthBounds(year, key);
}

function money(value: number): string {
  return formatCurrency(value);
}
