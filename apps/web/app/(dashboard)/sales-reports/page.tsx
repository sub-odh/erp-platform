"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { SalesTrendChart } from "@/components/sales/sales-trend-chart";
import { Select, Spinner } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { getSalesOrderReport } from "@/lib/sales-orders";
import type {
  SalesOrderReport,
  SalesOrderReportMonth,
  SalesOrderStaffRow,
} from "@/types/sales-orders";

const ALL_RANGE = "all";

const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function lastTwelveMonths(now = new Date()): SalesOrderReportMonth[] {
  const months: SalesOrderReportMonth[] = [];
  const cursor = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  );
  cursor.setUTCMonth(cursor.getUTCMonth() - 11);
  for (let index = 0; index < 12; index += 1) {
    const year = cursor.getUTCFullYear();
    const month = cursor.getUTCMonth();
    months.push({
      key: `${year}-${String(month + 1).padStart(2, "0")}`,
      label: MONTH_LABELS[month],
      salesOrderValue: 0,
      salesOrderCount: 0,
      wonDealValue: 0,
      staffSalesOrders: [],
      staffWonDeals: [],
    });
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return months;
}

function money(value: number): string {
  return `Rs. ${value.toLocaleString("en-NP", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function SalesOrderReportPage() {
  const [report, setReport] = useState<SalesOrderReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [globalRange, setGlobalRange] = useState(ALL_RANGE);
  const [salesRange, setSalesRange] = useState(ALL_RANGE);
  const [wonRange, setWonRange] = useState(ALL_RANGE);
  const [countRange, setCountRange] = useState(ALL_RANGE);
  const [staffSalesRange, setStaffSalesRange] = useState(ALL_RANGE);
  const [staffWonRange, setStaffWonRange] = useState(ALL_RANGE);

  function applyGlobalRange(value: string): void {
    setGlobalRange(value);
    setSalesRange(value);
    setWonRange(value);
    setCountRange(value);
    setStaffSalesRange(value);
    setStaffWonRange(value);
  }

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setReport(await getSalesOrderReport());
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Unable to load the sales order report.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const calendarMonths = useMemo(() => lastTwelveMonths(), []);
  const months =
    report?.months && report.months.length > 0 ? report.months : calendarMonths;
  const rangeOptions = useMemo(
    () => rollingMonthOptions(months, "All Months (Last 12 Months)"),
    [months],
  );
  const cardRangeOptions = useMemo(
    () => rollingMonthOptions(months, "All Range"),
    [months],
  );

  const salesMonths = useMemo(
    () => monthsInRange(months, salesRange),
    [months, salesRange],
  );
  const wonMonths = useMemo(
    () => monthsInRange(months, wonRange),
    [months, wonRange],
  );
  const countMonths = useMemo(
    () => monthsInRange(months, countRange),
    [months, countRange],
  );
  const staffSales = useMemo(
    () => mergeStaff(monthsInRange(months, staffSalesRange), "staffSalesOrders"),
    [months, staffSalesRange],
  );
  const staffWon = useMemo(() => {
    const rows = mergeStaff(
      monthsInRange(months, staffWonRange),
      "staffWonDeals",
    );
    const total = rows.reduce((sum, row) => sum + row.amount, 0);
    return rows.map((row) => ({
      ...row,
      vsTargetPercent: total > 0 ? Math.round((row.amount / total) * 100) : 0,
    }));
  }, [months, staffWonRange]);

  const salesTotal = salesMonths.reduce(
    (sum, month) => sum + month.salesOrderValue,
    0,
  );
  const wonTotal = wonMonths.reduce((sum, month) => sum + month.wonDealValue, 0);
  const orderCount = countMonths.reduce(
    (sum, month) => sum + month.salesOrderCount,
    0,
  );

  if (loading && !report) {
    return (
      <div className="flex min-h-80 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Sales Reports
        </h1>
        <div className="lg:w-72">
          <RangeSelect
            value={globalRange}
            options={rangeOptions}
            onChange={applyGlobalRange}
          />
        </div>
      </div>

      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
        >
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-3">
        <KpiCard
          label="Total Sales Order Value"
          value={money(salesTotal)}
          valueClass="text-emerald-600"
          range={salesRange}
          options={cardRangeOptions}
          onRangeChange={setSalesRange}
        />
        <KpiCard
          label="Total Won Deals (CRM)"
          value={money(wonTotal)}
          valueClass="text-blue-600"
          range={wonRange}
          options={cardRangeOptions}
          onRangeChange={setWonRange}
        />
        <KpiCard
          label="Sales Orders Generated"
          value={String(orderCount)}
          valueClass="text-slate-900"
          range={countRange}
          options={cardRangeOptions}
          onRangeChange={setCountRange}
        />
      </section>

      <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Revenue Trend: Sales Orders vs. Won Deals
        </h2>
        <div className="mt-4 min-w-0">
          <SalesTrendChart months={months} />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <StaffTable
          title="Staff Achievement (Sales Orders)"
          columns={["Employee", "Order Value"]}
          range={staffSalesRange}
          options={cardRangeOptions}
          onRangeChange={setStaffSalesRange}
          empty="No confirmed sales orders in this range."
          rows={staffSales.map((row) => [
            row.name,
            money(row.amount),
          ])}
        />
        <StaffTable
          title="Staff: Pipeline Won (CRM)"
          columns={["Employee", "Won Val", "Vs Target"]}
          range={staffWonRange}
          options={cardRangeOptions}
          onRangeChange={setStaffWonRange}
          empty="No won CRM deals in this range."
          rows={staffWon.map((row) => [
            row.name,
            money(row.amount),
            <TargetBar key={row.userId ?? row.name} percent={row.vsTargetPercent} />,
          ])}
        />
      </section>
    </div>
  );
}

function KpiCard({
  label,
  value,
  valueClass,
  range,
  options,
  onRangeChange,
}: {
  label: string;
  value: string;
  valueClass: string;
  range: string;
  options: Array<{ value: string; label: string }>;
  onRangeChange: (value: string) => void;
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </p>
        <RangeSelect
          compact
          value={range}
          options={options}
          onChange={onRangeChange}
        />
      </div>
      <p className={`mt-6 text-2xl font-bold ${valueClass}`}>{value}</p>
    </article>
  );
}

function StaffTable({
  title,
  columns,
  rows,
  empty,
  range,
  options,
  onRangeChange,
}: {
  title: string;
  columns: string[];
  rows: Array<Array<string | ReactNode>>;
  empty: string;
  range: string;
  options: Array<{ value: string; label: string }>;
  onRangeChange: (value: string) => void;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <h2 className="font-semibold text-slate-900">{title}</h2>
        <RangeSelect
          compact
          value={range}
          options={options}
          onChange={onRangeChange}
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
              {columns.map((column) => (
                <th key={column} className="px-5 py-3">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="h-28 px-5 text-center text-slate-400"
                >
                  {empty}
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={index} className="border-b border-slate-100 last:border-0">
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="px-5 py-3 text-slate-700">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function TargetBar({ percent }: { percent: number }) {
  const width = Math.max(0, Math.min(100, percent));
  return (
    <div className="flex min-w-40 items-center gap-2">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-blue-500"
          style={{ width: `${width}%` }}
        />
      </div>
      <span className="w-10 text-right text-xs font-semibold text-slate-600">
        {percent}%
      </span>
    </div>
  );
}

function RangeSelect({
  value,
  options,
  onChange,
  compact = false,
}: {
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
  compact?: boolean;
}) {
  return (
    <Select
      aria-label="Report period"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      wrapperClassName={compact ? "w-44 shrink-0" : "w-full"}
      className={
        compact
          ? "h-8 rounded-md py-1 text-xs text-slate-600"
          : "h-10 py-2 text-slate-700"
      }
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </Select>
  );
}

function rollingMonthOptions(
  months: SalesOrderReportMonth[],
  allLabel: string,
): Array<{ value: string; label: string }> {
  return [
    { value: ALL_RANGE, label: allLabel },
    ...[...months].reverse().map((month) => ({
      value: month.key,
      label: `${month.label} ${month.key.slice(0, 4)}`,
    })),
  ];
}

function monthsInRange(
  months: SalesOrderReportMonth[],
  range: string,
): SalesOrderReportMonth[] {
  if (range === ALL_RANGE) return months;
  return months.filter((month) => month.key === range);
}

function mergeStaff(
  months: SalesOrderReportMonth[],
  field: "staffSalesOrders" | "staffWonDeals",
): SalesOrderStaffRow[] {
  const bucket = new Map<string, SalesOrderStaffRow>();
  for (const month of months) {
    for (const row of month[field]) {
      const key = row.userId ?? `name:${row.name}`;
      const current = bucket.get(key);
      if (current) current.amount += row.amount;
      else bucket.set(key, { ...row });
    }
  }
  return [...bucket.values()].sort((left, right) => right.amount - left.amount);
}
