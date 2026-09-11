"use client";

import { Target } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";

import {
  DashboardBarChart,
  DashboardDistributionChart,
  DashboardDoughnut,
  DashboardLineChart,
} from "@/components/dashboard/dashboard-charts";
import { Select, Spinner } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { formatRupees, getDashboardOverview } from "@/lib/dashboard";
import type { DashboardOverview } from "@/types/dashboard";

type PerformanceRange = "7d" | "30d" | "90d" | "1y";

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invMonth, setInvMonth] = useState(currentMonth);
  const [salesMonth, setSalesMonth] = useState(currentMonth);
  const [distMonth, setDistMonth] = useState(currentMonth);
  const [range, setRange] = useState<PerformanceRange>("7d");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await getDashboardOverview({ invMonth, salesMonth, distMonth }));
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Unable to load the dashboard.",
      );
    } finally {
      setLoading(false);
    }
  }, [invMonth, salesMonth, distMonth]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !data) {
    return (
      <div className="flex min-h-80 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const performance = data?.salesPerformance[range] ?? [];

  return (
    <div className="space-y-3">
      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <section className="grid grid-cols-2 gap-2.5 md:grid-cols-3 xl:grid-cols-6">
        <StatCube
          href="#"
          value={String(data?.leaveBalance ?? 0)}
          label="Leave Bal"
          className="bg-[#198754] text-white"
        />
        <StatCube
          href="#"
          value={String(data?.leavesToday ?? 0)}
          label="Leaves Today"
          className="bg-[#ffc107] text-slate-900"
        />
        <StatCube
          href="/inventory"
          value={Number(data?.availableInventory ?? 0).toLocaleString("en-NP")}
          label="Available Inventory"
          className="bg-[#6610f2] text-white"
        />
        <StatCube
          href="#"
          value={String(data?.pendingMemos ?? 0)}
          label="Memos"
          className="bg-[#d63384] text-white"
        />
        <StatCube
          href="/payments"
          value={formatRupees(data?.totalDue ?? 0)}
          label="Total Due"
          className="bg-[#fd7e14] text-white"
        />
        <StatCube
          href="/sales-reports"
          value="Analysis"
          label="Sales Trend"
          className="bg-[#0d6efd] text-white"
        />
      </section>

      <div className="grid gap-3 lg:grid-cols-12">
        <div className="space-y-3 lg:col-span-8">
          <ChartCard title="One Year Sales Trend">
            <DashboardBarChart
              points={data?.yearTrend ?? []}
              color="#6610f2"
              height={210}
            />
          </ChartCard>

          <ChartCard
            title="Sales Performance"
            action={
              <Select
                aria-label="Sales Performance Range"
                value={range}
                onChange={(event) =>
                  setRange(event.target.value as PerformanceRange)
                }
                wrapperClassName="w-48"
                className="h-8 py-1 text-xs"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="1y">Full Year (Monthly)</option>
              </Select>
            }
          >
            <DashboardLineChart
              points={performance}
              height={160}
              type={range === "1y" ? "bar" : "line"}
            />
          </ChartCard>

          <div className="grid gap-3 md:grid-cols-2">
            <ChartCard title="CRM (Won Deals)" titleClass="text-blue-600">
              <DashboardBarChart
                points={[
                  { label: "CRM Won", value: data?.crmWon ?? 0 },
                ]}
                color="#0d6efd"
                height={132}
              />
            </ChartCard>
            <ChartCard
              title="Inventory Achievement"
              titleClass="text-emerald-600"
              action={
                <MonthFilter
                  label="Inventory Achievement Month"
                  value={invMonth}
                  onChange={setInvMonth}
                />
              }
            >
              <DashboardBarChart
                points={[
                  {
                    label: "Verified Invoiced",
                    value: data?.inventoryAchievement.achieved ?? 0,
                  },
                ]}
                color="#198754"
                height={132}
              />
              <p className="mt-1.5 text-center text-xs font-bold text-emerald-600">
                Achieved: {formatRupees(data?.inventoryAchievement.achieved ?? 0)}
              </p>
            </ChartCard>
          </div>

          <section className="rounded-xl bg-white p-3 shadow-sm">
            <div className="mb-2 flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-sm font-bold text-sky-600">
                <Target size={16} /> Yearly Target Progress (Inventory Invoiced)
                - {data?.yearly.year}
              </h2>
              <span className="rounded-md bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-600">
                {data?.yearly.percent ?? 0}% Completed
              </span>
            </div>
            <div className="mb-1 flex justify-between text-xs font-bold">
              <span className="text-emerald-600">
                Achieved: {formatRupees(data?.yearly.achieved ?? 0)}
              </span>
              <span className="text-slate-500">
                Target: {formatRupees(data?.yearly.target ?? 0)}
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-lg bg-slate-200">
              <div
                className="h-full rounded-lg bg-sky-500"
                style={{ width: `${Math.min(100, data?.yearly.percent ?? 0)}%` }}
              />
            </div>
            <p className="mt-1 text-right text-xs font-bold text-rose-600">
              Remaining: {formatRupees(data?.yearly.remaining ?? 0)}
            </p>
          </section>
        </div>

        <div className="space-y-3 lg:col-span-4">
          <section className="overflow-hidden rounded-xl bg-white shadow-sm">
            <div className="flex items-center justify-between px-3 py-2">
              <h2 className="text-sm font-bold text-slate-900">
                Field Visits (Today)
              </h2>
              <button
                type="button"
                className="rounded-full border border-blue-200 px-2.5 py-0.5 text-xs font-medium text-blue-600"
              >
                + New Visit
              </button>
            </div>
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-left font-semibold text-slate-500">
                <tr>
                  <th className="px-3 py-1.5">Employee</th>
                  <th className="py-1.5">Agenda</th>
                  <th className="px-3 py-1.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {(data?.fieldVisits.length ?? 0) === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-3 py-5 text-center text-slate-400"
                    >
                      No visits recorded today.
                    </td>
                  </tr>
                ) : (
                  data?.fieldVisits.map((visit) => (
                    <tr key={`${visit.employee}-${visit.agenda}`}>
                      <td className="px-3 py-1.5 font-semibold">
                        {visit.employee}
                      </td>
                      <td className="max-w-28 truncate py-1.5">
                        {visit.agenda}
                      </td>
                      <td className="px-3 py-1.5 text-right">{visit.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </section>

          <section className="rounded-xl bg-white p-3 shadow-sm">
            <div className="mb-1 flex items-center justify-between gap-3">
              <h2 className="text-sm font-bold text-slate-900">
                My Progress (Invoiced)
              </h2>
              <MonthFilter
                label="My Progress Month"
                value={salesMonth}
                onChange={setSalesMonth}
              />
            </div>
            <DashboardDoughnut
              achieved={data?.progress.achieved ?? 0}
              remaining={data?.progress.remaining ?? 0}
              height={140}
            />
            <p className="mt-1 text-center text-base font-bold text-blue-600">
              {data?.progress.percent ?? 0}% Achieved
            </p>
            <hr className="my-2 border-slate-100" />
            <div className="flex justify-around text-center text-xs">
              <div className="text-slate-500">
                Target:
                <br />
                <strong>{formatRupees(data?.progress.target ?? 0)}</strong>
              </div>
              <div className="text-rose-600">
                Remaining:
                <br />
                <strong>{formatRupees(data?.progress.remaining ?? 0)}</strong>
              </div>
            </div>
          </section>

          <ChartCard
            title="Sales Distribution"
            action={
              <MonthFilter
                label="Sales Distribution Month"
                value={distMonth}
                onChange={setDistMonth}
              />
            }
          >
            <DashboardDistributionChart
              points={data?.salesDistribution.points ?? []}
              height={132}
            />
          </ChartCard>

          <section className="overflow-hidden rounded-xl bg-white shadow-sm">
            <h2 className="px-3 py-2 text-sm font-bold text-rose-600">
              Top 5 Debtors
            </h2>
            <table className="w-full text-xs">
              <tbody>
                {(data?.topDebtors.length ?? 0) === 0 ? (
                  <tr>
                    <td className="px-3 py-5 text-center text-slate-400">
                      No outstanding debtors.
                    </td>
                  </tr>
                ) : (
                  data?.topDebtors.map((debtor) => (
                    <tr key={debtor.name} className="border-t border-slate-50">
                      <td className="px-3 py-1.5">{debtor.name}</td>
                      <td className="px-3 py-1.5 text-right font-bold text-rose-600">
                        {formatRupees(debtor.totalDebt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </section>
        </div>
      </div>
    </div>
  );
}

function StatCube({
  href,
  value,
  label,
  className,
}: {
  href: string;
  value: string;
  label: string;
  className: string;
}) {
  const content = (
    <>
      <p className="text-lg font-extrabold leading-tight">{value}</p>
      <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide opacity-90">
        {label}
      </p>
    </>
  );
  const classes = `rounded-xl px-3 py-2.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${className}`;
  if (href === "#") {
    return <div className={classes}>{content}</div>;
  }
  return (
    <Link href={href} className={`block ${classes}`}>
      {content}
    </Link>
  );
}

function MonthFilter({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <input
      type="month"
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="rounded-md border border-slate-200 px-2 py-0.5 text-xs text-slate-600 outline-none focus:border-blue-400"
    />
  );
}

function ChartCard({
  title,
  titleClass,
  action,
  children,
}: {
  title: string;
  titleClass?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className={`text-sm font-bold ${titleClass ?? "text-slate-900"}`}>
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}
