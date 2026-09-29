"use client";

import { Target } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";

import {
  DashboardBarChart,
  DashboardDistributionChart,
  DashboardDoughnut,
  DashboardLineChart,
} from "@/components/dashboard/dashboard-charts";
import { Button, Modal, Select, Spinner, Textarea } from "@/components/ui";
import { ApiError } from "@/lib/api";
import {
  formatRupees,
  getDashboardOverview,
  postDashboardAction,
} from "@/lib/dashboard";
import type { DashboardOverview, DashboardVisit } from "@/types/dashboard";

type PerformanceRange = "7d" | "30d" | "90d" | "1y";

const YEAR_MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

function kathmanduMonth(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kathmandu",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value ?? "1970";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  return `${year}-${month}`;
}

function readMonth(value: string | null, fallback: string): string {
  return value && YEAR_MONTH.test(value) ? value : fallback;
}

function monthDay(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1)).toLocaleDateString(
    "en-US",
    { month: "short", day: "2-digit", timeZone: "UTC" },
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fallbackMonth = kathmanduMonth();
  const invMonth = readMonth(searchParams.get("inv_month"), fallbackMonth);
  const salesMonth = readMonth(searchParams.get("sales_month"), fallbackMonth);
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<PerformanceRange>("7d");
  const [detail, setDetail] = useState<DashboardVisit | null>(null);
  const [backVisitId, setBackVisitId] = useState<string | null>(null);
  const [remarks, setRemarks] = useState("");
  const [acting, setActing] = useState(false);

  useEffect(() => {
    if (
      searchParams.get("inv_month") === invMonth &&
      searchParams.get("sales_month") === salesMonth
    ) {
      return;
    }

    const next = new URLSearchParams(searchParams.toString());
    next.set("inv_month", invMonth);
    next.set("sales_month", salesMonth);
    router.replace(`/dashboard?${next.toString()}`);
  }, [searchParams, invMonth, salesMonth, router]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(
        await getDashboardOverview({
          inv_month: invMonth,
          sales_month: salesMonth,
        }),
      );
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.status === 403
            ? "You do not have permission to view the dashboard."
            : cause.message
          : "Unable to load the dashboard.",
      );
    } finally {
      setLoading(false);
    }
  }, [invMonth, salesMonth]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!data?.activeVisitId) {
      return;
    }

    const timer = window.setInterval(() => {
      window.alert(
        "Reminder: You have an active field visit. Please don't forget to click 'I'm Back' to mark your return.",
      );
    }, 1_800_000);

    return () => window.clearInterval(timer);
  }, [data?.activeVisitId]);

  function setMonth(key: "inv_month" | "sales_month", value: string) {
    const next = new URLSearchParams();
    next.set("inv_month", key === "inv_month" ? value : invMonth);
    next.set("sales_month", key === "sales_month" ? value : salesMonth);
    router.replace(`/dashboard?${next.toString()}`);
  }

  async function runAction(body: {
    mark_back_id?: string;
    visit_remarks?: string;
    confirm_sub_id?: string;
    reject_sub_id?: string;
  }) {
    setActing(true);
    setError(null);
    try {
      await postDashboardAction(body);
      setBackVisitId(null);
      setRemarks("");
      router.replace("/dashboard");
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Unable to update the dashboard.",
      );
    } finally {
      setActing(false);
    }
  }

  if (loading && !data) {
    return (
      <div className="flex min-h-80 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
        {error}
      </div>
    );
  }

  const adminView = data?.adminView ?? false;
  const hasTarget = data?.hasTarget ?? false;
  const showProgress = hasTarget && (data?.monthlyTarget ?? 0) > 0;
  const performance = data?.salesPerformance[range] ?? [];

  return (
    <div className="space-y-3">
      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {data?.substitutions.map((request) => (
        <div
          key={request.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-gradient-to-br from-[#04015b] to-[#af00ff] px-4 py-3 text-sm text-white shadow-sm"
        >
          <p>
            <span className="mr-2 rounded-full border border-white/40 px-2 py-0.5 text-[10px] font-semibold">
              SUBSTITUTE REQUEST
            </span>
            <strong>{request.name}</strong> requested you to cover their duty
            from{" "}
            <strong>
              {monthDay(request.startDate)} to {monthDay(request.endDate)}
            </strong>
            .
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              className="h-8 rounded-full bg-white px-3 text-xs text-blue-700"
              disabled={acting}
              onClick={() => {
                if (window.confirm("Confirm you can cover this duty?")) {
                  void runAction({ confirm_sub_id: request.id });
                }
              }}
            >
              Confirm & Vouch
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-8 rounded-full border-white/60 bg-transparent px-3 text-xs text-white"
              disabled={acting}
              onClick={() => {
                if (window.confirm("Decline this substitution request?")) {
                  void runAction({ reject_sub_id: request.id });
                }
              }}
            >
              Not Now
            </Button>
          </div>
        </div>
      ))}

      <section className="grid grid-cols-2 gap-2.5 md:grid-cols-3 xl:grid-cols-6">
        <StatCube
          href="/hr/my-leaves"
          value={String(data?.leaveBalance ?? 0)}
          label="Leave Bal"
          className="bg-[#198754] text-white"
        />
        <StatCube
          href="/hr/leaves"
          value={String(data?.leavesToday ?? 0)}
          label="Leaves Today"
          className={`bg-[#ffc107] text-slate-900 ${
            (data?.leavesToday ?? 0) > 0 ? "animate-pulse" : ""
          }`}
        />
        {adminView ? (
          <>
            <StatCube
              href="/inventory"
              value={Number(data?.availableInventory ?? 0).toLocaleString(
                "en-NP",
              )}
              label="Available Inventory"
              className="bg-[#6610f2] text-white"
            />
            <StatCube
              href="/hr/memos"
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
          </>
        ) : null}
      </section>

      {!adminView && (data?.partners.length ?? 0) > 0 ? (
        <section className="rounded-xl bg-slate-100 p-3">
          <h2 className="mb-2 text-xs font-bold tracking-wide text-slate-500">
            My Assigned Partners
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {data?.partners.map((partner) => (
              <div
                key={partner.id}
                className="w-40 shrink-0 rounded-xl border border-slate-200 bg-white p-3 text-center"
              >
                {partner.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={partner.logoUrl}
                    alt=""
                    className="mx-auto mb-2 h-16 w-16 rounded-lg bg-slate-50 object-contain p-1"
                  />
                ) : null}
                <p className="truncate text-sm font-bold text-slate-800">
                  {partner.name}
                </p>
                <div className="mt-2 flex justify-center gap-2 text-xs">
                  {partner.portalUrl ? (
                    <a
                      href={partner.portalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg bg-slate-100 px-2 py-1 text-slate-600"
                    >
                      Portal
                    </a>
                  ) : null}
                  {partner.websiteUrl ? (
                    <a
                      href={partner.websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg bg-slate-100 px-2 py-1 text-slate-600"
                    >
                      Website
                    </a>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-12">
        <div className="space-y-3 lg:col-span-8">
          {adminView ? (
            <>
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
            </>
          ) : null}

          {hasTarget ? (
            <>
              <div className="grid gap-3 md:grid-cols-2">
                <ChartCard title="CRM (Won Deals)" titleClass="text-blue-600">
                  <DashboardBarChart
                    points={[{ label: "CRM Won", value: data?.crmWon ?? 0 }]}
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
                      onChange={(value) => setMonth("inv_month", value)}
                    />
                  }
                >
                  <DashboardBarChart
                    points={[
                      {
                        label: "Verified Invoiced",
                        value: data?.inventoryAchievement ?? 0,
                      },
                    ]}
                    color="#198754"
                    height={132}
                  />
                  <p className="mt-1.5 text-center text-xs font-bold text-emerald-600">
                    Achieved: {formatRupees(data?.inventoryAchievement ?? 0)}
                  </p>
                </ChartCard>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <TargetCard
                  title="Monthly Target (Payment Recovered)"
                  titleClass="text-blue-600"
                  barClass="bg-blue-600"
                  percent={data?.progress.cappedPercent ?? 0}
                  achieved={data?.progress.achieved ?? 0}
                  target={data?.progress.target ?? 0}
                  remaining={data?.progress.remaining ?? 0}
                />
                <TargetCard
                  title="Yearly Target (Payment Recovered)"
                  titleClass="text-sky-600"
                  barClass="bg-sky-500"
                  percent={data?.yearly.percent ?? 0}
                  achieved={data?.yearly.achieved ?? 0}
                  target={data?.yearly.target ?? 0}
                  remaining={data?.yearly.remaining ?? 0}
                  icon={<Target size={14} />}
                />
              </div>
            </>
          ) : null}
        </div>

        <div className="space-y-3 lg:col-span-4">
          <section className="overflow-hidden rounded-xl bg-white shadow-sm">
            <div className="flex items-center justify-between px-3 py-2">
              <h2 className="text-sm font-bold text-slate-900">
                Field Visits (Today)
              </h2>
              <Link
                href="/hr/field-visits"
                className="rounded-full border border-blue-200 px-2.5 py-0.5 text-xs font-medium text-blue-600"
              >
                + New Visit
              </Link>
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
                {data?.fieldVisits.map((visit) => (
                  <tr
                    key={visit.id}
                    className="group cursor-pointer border-t border-slate-50"
                    onClick={() => setDetail(visit)}
                  >
                    <td className="px-3 py-1.5 font-semibold">
                      {visit.employee}
                    </td>
                    <td className="max-w-28 truncate py-1.5">{visit.agenda}</td>
                    <td
                      className="px-3 py-1.5 text-right"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {visit.inTime ? (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">
                          {visit.status}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          <span className="rounded-full bg-rose-600 px-2 py-0.5 text-white group-hover:hidden">
                            OUT
                          </span>
                          {visit.mine ? (
                            <button
                              type="button"
                              className="hidden rounded-full bg-emerald-600 px-2 py-0.5 text-white group-hover:inline"
                              onClick={() => {
                                setRemarks("");
                                setBackVisitId(visit.id);
                              }}
                            >
                              I&apos;m Back
                            </button>
                          ) : null}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {showProgress ? (
            <section className="rounded-xl bg-white p-3 shadow-sm">
              <div className="mb-1 flex items-center justify-between gap-3">
                <h2 className="text-sm font-bold text-slate-900">
                  My Progress (Payment Recovered)
                </h2>
                <MonthFilter
                  label="My Progress Month"
                  value={salesMonth}
                  onChange={(value) => setMonth("sales_month", value)}
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
          ) : null}

          {adminView ? (
            <>
              <ChartCard title="Sales Distribution">
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
                    {data?.topDebtors.map((debtor) => (
                      <tr key={debtor.name} className="border-t border-slate-50">
                        <td className="px-3 py-1.5">{debtor.name}</td>
                        <td className="px-3 py-1.5 text-right font-bold text-rose-600">
                          {formatRupees(debtor.totalDebt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            </>
          ) : null}
        </div>
      </div>

      <Modal
        open={detail !== null}
        title={detail?.fullName || "Field Visit Detail"}
        onClose={() => setDetail(null)}
      >
        {detail ? (
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-xs font-bold uppercase text-slate-400">
                Agenda
              </p>
              <p className="font-semibold">{detail.agenda}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-bold uppercase text-slate-400">
                  Visit Type
                </p>
                <p>{detail.visitType}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-slate-400">
                  Status
                </p>
                <p className={detail.inTime ? "text-emerald-700" : "text-rose-600"}>
                  {detail.inTime ? "Completed" : "Currently Out"}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-slate-400">
                  Out Time
                </p>
                <p className="font-semibold">{detail.outTime}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-slate-400">
                  In Time
                </p>
                <p className="font-semibold">{detail.inTime || "--:--"}</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-slate-400">
                Remarks
              </p>
              <p className="rounded bg-slate-50 p-2 text-slate-600">
                {detail.remarks || "No remarks provided."}
              </p>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={backVisitId !== null}
        title="Welcome Back!"
        onClose={() => setBackVisitId(null)}
        footer={
          <>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setBackVisitId(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="success"
              loading={acting}
              disabled={remarks.length === 0}
              onClick={() => {
                if (!backVisitId) return;
                void runAction({
                  mark_back_id: backVisitId,
                  visit_remarks: remarks,
                });
              }}
            >
              Confirm Return
            </Button>
          </>
        }
      >
        <label className="mb-1 block text-xs font-bold uppercase text-slate-400">
          Any Visit Remarks?
        </label>
        <Textarea
          name="visit_remarks"
          rows={3}
          required
          value={remarks}
          onChange={(event) => setRemarks(event.target.value)}
        />
      </Modal>
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
  return (
    <Link
      href={href}
      className={`block rounded-xl px-3 py-2.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${className}`}
    >
      <p className="text-lg font-extrabold leading-tight">{value}</p>
      <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide opacity-90">
        {label}
      </p>
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

function TargetCard({
  title,
  titleClass,
  barClass,
  percent,
  achieved,
  target,
  remaining,
  icon,
}: {
  title: string;
  titleClass: string;
  barClass: string;
  percent: number;
  achieved: number;
  target: number;
  remaining: number;
  icon?: ReactNode;
}) {
  return (
    <section className="rounded-xl bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className={`flex items-center gap-1 text-sm font-bold ${titleClass}`}>
          {icon}
          {title}
        </h2>
        <span className="rounded-md bg-slate-50 px-2 py-0.5 text-xs font-semibold">
          {percent}%
        </span>
      </div>
      <div className="mb-1 flex justify-between text-xs font-bold">
        <span className="text-emerald-600">
          Recovered: {formatRupees(achieved)}
        </span>
        <span className="text-slate-500">Target: {formatRupees(target)}</span>
      </div>
      <div className="h-5 overflow-hidden rounded-full bg-slate-200">
        <div
          className={`flex h-full items-center justify-center text-[10px] font-bold text-white ${barClass}`}
          style={{ width: `${percent}%` }}
        >
          {percent > 8 ? `${percent}%` : ""}
        </div>
      </div>
      <p className="mt-1 text-right text-xs font-bold text-rose-600">
        Remaining: {formatRupees(remaining)}
      </p>
    </section>
  );
}
