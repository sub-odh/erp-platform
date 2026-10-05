"use client";

import { Eye, FolderOpen, Printer, RefreshCw, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Spinner } from "@/components/ui";
import { getSupportVisits } from "@/lib/visits";
import type { SupportVisit, SupportVisitType } from "@/types/visit";

export default function SupportVisitsPage() {
  const router = useRouter();
  const [visits, setVisits] = useState<SupportVisit[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setVisits(await getSupportVisits());
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load support visits.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const thisMonth = currentMonthKey();
  const stats = useMemo(
    () => ({
      total: visits.length,
      onPremise: visits.filter((visit) => visit.visitType === "ONPREMISE").length,
      remote: visits.filter((visit) => visit.visitType === "REMOTE").length,
      thisMonth: visits.filter((visit) => visit.visitDate.slice(0, 7) === thisMonth)
        .length,
    }),
    [thisMonth, visits],
  );

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return visits;
    }

    return visits.filter((visit) => visitSearchText(visit).includes(query));
  }, [search, visits]);

  function openVisit(id: string, print = false) {
    router.push(
      print
        ? `/hr/support-visits/${id}?print=true`
        : `/hr/support-visits/${id}`,
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[1.1rem] font-extrabold text-slate-900">
            Service Visit Logs
          </h1>
          <p className="text-xs text-slate-500">
            Monitoring system-wide maintenance and support activities
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw
            size={14}
            className={`mr-1 text-slate-500 ${loading ? "animate-spin" : ""}`}
            aria-hidden
          />
          Refresh
        </button>
      </div>

      {error ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mb-6 flex flex-wrap gap-3">
        <StatChip icon="📋" iconClass="bg-slate-100 text-slate-600" value={stats.total} label="Total Visits" />
        <StatChip icon="🏢" iconClass="bg-emerald-50 text-emerald-600" value={stats.onPremise} label="On-Premise" />
        <StatChip icon="💻" iconClass="bg-blue-50 text-blue-600" value={stats.remote} label="Remote" />
        <StatChip
          icon="📅"
          iconClass="bg-indigo-600 text-white"
          value={stats.thisMonth}
          label="This Month"
          highlight
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <span className="text-sm font-bold text-slate-900">Recent Activity</span>
          <label className="relative w-full max-w-[300px]">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search client, tech, team, date..."
              className="w-full rounded-[10px] border-[1.5px] border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-[0.8rem] text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-[3px] focus:ring-blue-600/10"
            />
          </label>
        </div>

        {loading && visits.length === 0 ? (
          <div className="flex min-h-64 items-center justify-center">
            <Spinner />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[0.65rem] font-bold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Ref No</th>
                  <th className="px-4 py-3">Client & Issue</th>
                  <th className="px-4 py-3">Technician</th>
                  <th className="px-4 py-3">Schedule</th>
                  <th className="px-4 py-3">Mode</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {visits.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                      <FolderOpen size={42} className="mx-auto mb-3 opacity-25" aria-hidden />
                      <p className="font-bold">No service logs found.</p>
                    </td>
                  </tr>
                ) : visible.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                      <Search size={36} className="mx-auto mb-3 opacity-25" aria-hidden />
                      <p className="font-bold">No records match your search.</p>
                    </td>
                  </tr>
                ) : (
                  visible.map((visit) => {
                    const tech = technicianLabel(visit.technicianName);
                    const mode = modeStyle(visit.visitType);
                    const issue = (visit.issueDescription ?? "").slice(0, 60);

                    return (
                      <tr
                        key={visit.id}
                        className="cursor-pointer border-b border-slate-100 transition hover:bg-slate-50"
                        onClick={() => openVisit(visit.id)}
                      >
                        <td className="px-4 py-3.5">
                          <span className="rounded bg-blue-50 px-1.5 py-0.5 font-mono text-xs font-bold text-blue-600">
                            {visit.visitNumber}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="text-[0.85rem] font-bold text-slate-900">
                            {visit.clientName}
                          </div>
                          <div className="max-w-[300px] truncate text-[0.7rem] text-slate-500">
                            <span className="mr-1 inline-flex rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-800">
                              {visit.deptName?.trim() || "N/A"}
                            </span>
                            {issue}...
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-indigo-600 text-[0.7rem] font-extrabold text-white">
                              {tech.initials}
                            </div>
                            <div>
                              <div className="text-[0.8rem] font-semibold text-slate-700">
                                {tech.display}
                              </div>
                              {visit.teamMembers?.trim() ? (
                                <div className="group relative inline-block">
                                  <div className="cursor-help border-b border-dotted border-indigo-500 text-[0.65rem] font-bold text-indigo-500">
                                    + Members
                                  </div>
                                  <div className="pointer-events-none absolute bottom-[125%] left-0 z-10 w-[180px] rounded-lg bg-slate-800 px-2.5 py-2 text-left text-[0.7rem] leading-snug text-white opacity-0 shadow-lg transition group-hover:opacity-100">
                                    <strong>Attendance Team:</strong>
                                    <br />
                                    {visit.teamMembers}
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="text-xs font-bold text-slate-900">
                            {formatScheduleDate(visit.visitDate)}
                          </div>
                          <div className="text-[0.65rem] text-slate-500">
                            {formatScheduleTime(visit.timeStarted)}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[0.65rem] font-bold"
                            style={{ background: mode.bg, color: mode.color }}
                          >
                            <span
                              className="inline-block h-[5px] w-[5px] rounded-full"
                              style={{ background: mode.color }}
                              aria-hidden
                            />
                            {mode.label}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div
                            className="flex justify-end gap-1"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <button
                              type="button"
                              title="View"
                              aria-label={`View ${visit.visitNumber}`}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:border-slate-900 hover:bg-slate-900 hover:text-white"
                              onClick={() => openVisit(visit.id)}
                            >
                              <Eye size={14} aria-hidden />
                            </button>
                            <button
                              type="button"
                              title="Print"
                              aria-label={`Print ${visit.visitNumber}`}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-blue-600 hover:border-slate-900 hover:bg-slate-900 hover:text-white"
                              onClick={() => openVisit(visit.id, true)}
                            >
                              <Printer size={14} aria-hidden />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatChip({
  icon,
  iconClass,
  value,
  label,
  highlight = false,
}: {
  icon: string;
  iconClass: string;
  value: number;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex min-w-[150px] flex-1 items-center gap-3 rounded-xl border px-[18px] py-3 shadow-sm ${
        highlight ? "border-blue-600 bg-[#f8faff]" : "border-slate-200 bg-white"
      }`}
    >
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-[10px] text-base ${iconClass}`}
      >
        {icon}
      </div>
      <div>
        <div className="text-[1.1rem] font-extrabold leading-none text-slate-800">
          {value}
        </div>
        <div className="mt-0.5 text-[0.65rem] font-bold uppercase text-slate-400">
          {label}
        </div>
      </div>
    </div>
  );
}

function modeStyle(type: SupportVisitType): {
  label: string;
  color: string;
  bg: string;
} {
  if (type === "ONPREMISE") {
    return { label: "Onpremise", color: "#059669", bg: "#ecfdf5" };
  }

  if (type === "ONCALL") {
    return { label: "Oncall", color: "#d97706", bg: "#fffbeb" };
  }

  return { label: "Remote", color: "#2563eb", bg: "#eff6ff" };
}

function technicianLabel(name: string | null): {
  initials: string;
  display: string;
} {
  const display = name?.trim() || "System User";
  const parts = display.split(/\s+/).filter(Boolean);
  const first = parts[0] ?? "S";
  const last = parts[1] ?? "";

  return {
    display,
    initials: `${first[0] ?? "S"}${last[0] ?? ""}`.toUpperCase(),
  };
}

function visitSearchText(visit: SupportVisit): string {
  return [
    visit.visitNumber,
    visit.clientName,
    visit.deptName ?? "",
    visit.issueDescription ?? "",
    visit.technicianName ?? "System User",
    visit.teamMembers ?? "",
    visit.visitDate,
    formatScheduleDate(visit.visitDate),
    formatScheduleTime(visit.timeStarted),
    modeStyle(visit.visitType).label,
  ]
    .join(" ")
    .toLowerCase();
}

function formatScheduleDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return value;
  }

  const formatted = new Date(year, month - 1, day).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return formatted.replace(/ (\d{4})$/, ", $1");
}

function formatScheduleTime(value: string | null): string {
  if (!value) {
    return "";
  }

  const [hourText, minuteText] = value.split(":");
  const hour = Number(hourText);

  if (!Number.isFinite(hour)) {
    return value;
  }

  const suffix = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;

  return `${String(hour12).padStart(2, "0")}:${(minuteText ?? "00").slice(0, 2)} ${suffix}`;
}

function currentMonthKey(): string {
  const now = new Date();

  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
