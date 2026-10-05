"use client";

import {
  ArrowUpDown,
  CalendarCheck,
  FileSpreadsheet,
  MapPin,
  Pencil,
  Printer,
  Umbrella,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

import { Button, Input, Modal, Spinner } from "@/components/ui";
import {
  createAttendance,
  currentMonthRange,
  getAttendanceReport,
  todayIsoDate,
  updateAttendance,
} from "@/lib/attendance";
import { getStoredUser } from "@/lib/auth";
import { PHP_ROLE_1 } from "@/lib/role-access";
import type { AttendanceReportRow } from "@/types/attendance";

const MSSQL_UNAVAILABLE =
  "MSSQL connection driver unavailable. Showing cached local logs.";

const EDIT_ROLES = new Set<string>([...PHP_ROLE_1, "HR"]);

interface EditTarget {
  attendanceId: string | null;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  date: string;
  inTime: string;
  outTime: string;
}

export default function AttendanceReportPage() {
  const initialStart = currentMonthRange().startDate;
  const initialEnd = todayIsoDate();
  const [rows, setRows] = useState<AttendanceReportRow[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [startInput, setStartInput] = useState(initialStart);
  const [endInput, setEndInput] = useState(initialEnd);
  const [startDate, setStartDate] = useState(initialStart);
  const [endDate, setEndDate] = useState(initialEnd);
  const [excludeInput, setExcludeInput] = useState("");
  const [exclude, setExclude] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [sort, setSort] = useState<{ column: number; ascending: boolean } | null>(
    null,
  );
  const [edit, setEdit] = useState<EditTarget | null>(null);
  const [saving, setSaving] = useState(false);
  const [canEdit, setCanEdit] = useState(false);

  const loadReport = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const result = await getAttendanceReport({
        search: searchQuery || undefined,
        startDate,
        endDate,
        exclude: exclude || undefined,
      });
      setRows(result.data);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load the attendance report.",
      );
    } finally {
      setLoading(false);
    }
  }, [endDate, exclude, searchQuery, startDate]);

  useEffect(() => {
    void loadReport();
  }, [loadReport]);

  useEffect(() => {
    setCanEdit(EDIT_ROLES.has(getStoredUser()?.role ?? ""));
  }, []);

  function applyFilters(event?: FormEvent<HTMLFormElement>): void {
    event?.preventDefault();
    setSearchQuery(searchInput.trim());
    setExclude(excludeInput.trim());
    setStartDate(startInput);
    setEndDate(endInput);
  }

  function applyQuick(kind: "today" | "monthly"): void {
    if (kind === "today") {
      const today = todayIsoDate();
      setStartInput(today);
      setEndInput(today);
      setStartDate(today);
      setEndDate(today);
    } else {
      const range = currentMonthRange();
      setStartInput(range.startDate);
      setEndInput(range.endDate);
      setStartDate(range.startDate);
      setEndDate(range.endDate);
    }

    setSearchQuery(searchInput.trim());
    setExclude(excludeInput.trim());
  }

  function runSync(): void {
    setSyncing(true);
    window.setTimeout(() => {
      setSyncing(false);
      setSyncMessage(MSSQL_UNAVAILABLE);
    }, 400);
  }

  function toggleSort(column: number): void {
    setSort((current) => ({
      column,
      ascending: current?.column === column ? !current.ascending : true,
    }));
  }

  const visible = useMemo(() => {
    if (!sort) {
      return rows;
    }

    return [...rows].sort((left, right) => {
      const result = sortValue(left, sort.column).localeCompare(
        sortValue(right, sort.column),
        undefined,
        { numeric: true, sensitivity: "base" },
      );

      return sort.ascending ? result : -result;
    });
  }, [rows, sort]);

  function openEdit(row: AttendanceReportRow): void {
    setEdit({
      attendanceId: row.attendanceId,
      employeeId: row.employeeId,
      employeeName: row.employeeName,
      employeeCode: row.employeeCode,
      date: row.date,
      inTime: toTimeInput(row.inTime),
      outTime: toTimeInput(row.outTime),
    });
  }

  async function saveEdit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (!edit) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const inTime = edit.inTime.trim();
      const outTime = edit.outTime.trim();

      if (edit.attendanceId) {
        await updateAttendance(edit.attendanceId, {
          inTime: inTime || "00:00:00",
          outTime: outTime || "00:00:00",
        });
      } else if (inTime || outTime) {
        await createAttendance({
          employeeId: edit.employeeId,
          punchDate: edit.date,
          inTime: inTime || undefined,
          outTime: outTime || undefined,
        });
      }

      setEdit(null);
      await loadReport();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update this punch.",
      );
    } finally {
      setSaving(false);
    }
  }

  function downloadCsv(): void {
    setExporting(true);

    try {
      const header = [
        "Employee",
        "Date",
        "Office Punch",
        "Field Duty",
        "Leave / Holiday",
        "Status",
        "Punctuality",
      ];
      const lines = visible.map((row) =>
        [
          `${row.employeeName} ${row.employeeCode}`,
          formatReportDate(row.date),
          officePunchText(row),
          fieldDutyText(row),
          leaveHolidayText(row),
          row.status,
          punctualityText(row),
        ]
          .map(csvCell)
          .join(","),
      );
      const blob = new Blob([[header.join(","), ...lines].join("\r\n")], {
        type: "text/csv;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Report_${todayIsoDate()}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      <style>{PRINT_CSS}</style>
      {syncing ? (
        <div className="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-white/80">
          <Spinner />
          <h2 className="mt-3 text-lg font-bold text-slate-900">
            Synchronizing MSSQL Data...
          </h2>
        </div>
      ) : null}

      {syncMessage ? (
        <div className="report-no-print mb-4 flex items-start justify-between gap-3 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
          <span>{syncMessage}</span>
          <button
            type="button"
            aria-label="Close"
            onClick={() => setSyncMessage(null)}
            className="rounded p-1 text-sky-700 hover:bg-sky-100"
          >
            <X size={16} />
          </button>
        </div>
      ) : null}

      <div className="report-no-print mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="mb-0 text-2xl font-bold text-slate-900">Attendance Report</h1>
          <p className="mb-0 text-sm text-slate-500">
            Cross-referencing Device Logs, Leaves, Holidays, and Field Visits
          </p>
          <small className="text-slate-500">Last Sync: —</small>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={runSync}
            className="rounded-full border border-blue-600 px-3 py-1 text-sm text-blue-600 shadow-sm hover:bg-blue-50"
          >
            Sync All
          </button>
          <button
            type="button"
            onClick={runSync}
            className="rounded-full bg-emerald-600 px-3 py-1 text-sm text-white shadow-sm hover:bg-emerald-700"
          >
            Sync Today
          </button>
          <div className="ml-2 inline-flex overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
            <button
              type="button"
              onClick={downloadCsv}
              disabled={exporting}
              className="inline-flex items-center border-r border-slate-200 px-3 py-1 text-sm text-slate-800 hover:bg-slate-50 disabled:opacity-60"
            >
              <FileSpreadsheet size={14} className="mr-1 text-emerald-600" aria-hidden />
              CSV
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center px-3 py-1 text-sm text-slate-800 hover:bg-slate-50"
            >
              <Printer size={14} className="mr-1 text-blue-600" aria-hidden />
              Print
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <div className="report-no-print mb-4 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-[15px] bg-white shadow-sm">
        <form onSubmit={applyFilters} className="report-no-print bg-white px-4 py-3">
          <div className="mb-2 grid grid-cols-1 gap-2 md:grid-cols-12">
            <label className="md:col-span-3">
              <span className="mb-1 block text-xs font-bold text-slate-500">
                Search Employee
              </span>
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Name or Code..."
                className="h-9 w-full rounded-md border-2 border-[#0d6efd] px-3 text-sm outline-none"
              />
            </label>
            <label className="md:col-span-3">
              <span className="mb-1 block text-xs font-bold text-slate-500">Start Date</span>
              <input
                type="date"
                value={startInput}
                onChange={(event) => setStartInput(event.target.value)}
                className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm outline-none"
              />
            </label>
            <label className="md:col-span-3">
              <span className="mb-1 block text-xs font-bold text-slate-500">End Date</span>
              <input
                type="date"
                value={endInput}
                onChange={(event) => setEndInput(event.target.value)}
                className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm outline-none"
              />
            </label>
            <div className="flex items-end gap-1 md:col-span-3">
              <button
                type="submit"
                className="h-9 flex-1 rounded-md bg-blue-600 text-sm text-white hover:bg-blue-700"
              >
                Apply Filters
              </button>
              <button
                type="button"
                onClick={() => applyQuick("today")}
                className="h-9 rounded-md border border-slate-300 px-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => applyQuick("monthly")}
                className="h-9 rounded-md border border-slate-300 px-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                Monthly
              </button>
            </div>
          </div>
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-red-600">
              Exclude Codes (Comma Separated)
            </span>
            <input
              value={excludeInput}
              onChange={(event) => setExcludeInput(event.target.value)}
              placeholder="e.g. 101, 105"
              className="h-9 w-full rounded-md border border-slate-300 bg-[#fff9f9] px-3 text-sm outline-none"
            />
          </label>
        </form>

        <div className="overflow-x-auto">
          <table className="mb-0 w-full border-collapse text-left text-sm">
            <thead>
              <tr className="bg-[#f8f9fa] text-[11px] font-semibold uppercase tracking-[0.5px] text-slate-500">
                <SortableHeader label="Employee" onClick={() => toggleSort(0)} />
                <SortableHeader label="Date" onClick={() => toggleSort(1)} />
                <th className="border-0 px-3 py-3">Office Punch</th>
                <th className="border-0 px-3 py-3">Field Duty</th>
                <th className="border-0 px-3 py-3">Leave / Holiday</th>
                <SortableHeader
                  label="Status"
                  align="center"
                  onClick={() => toggleSort(5)}
                />
                <SortableHeader
                  label="Punctuality"
                  align="center"
                  onClick={() => toggleSort(6)}
                />
              </tr>
            </thead>
            <tbody>
              {loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <Spinner />
                  </td>
                </tr>
              ) : (
                visible.map((row) => {
                  const punch = hasPunch(row);

                  return (
                    <tr
                      key={`${row.employeeId}-${row.date}`}
                      className="border-t border-slate-100 align-middle hover:bg-slate-50"
                    >
                      <td className="py-3 pl-4 pr-3">
                        <div className="font-bold text-slate-900">{row.employeeName}</div>
                        <small className="text-slate-500">{row.employeeCode}</small>
                      </td>
                      <td className="px-3 py-3">
                        <small className="font-bold text-slate-800">
                          {formatReportDate(row.date)}
                        </small>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            {punch ? (
                              <>
                                <div className="text-sm font-bold text-blue-600">
                                  {row.inTime ?? "--:--:--"} - {row.outTime ?? "--:--:--"}
                                </div>
                                <div className="text-[11px] text-slate-500">
                                  {row.duration ?? ""}
                                </div>
                              </>
                            ) : (
                              <span className="text-slate-500">-</span>
                            )}
                          </div>
                          {canEdit ? (
                            <button
                              type="button"
                              title="Edit Office Punch"
                              aria-label={`Edit office punch for ${row.employeeName} on ${row.date}`}
                              onClick={() => openEdit(row)}
                              className="p-0 text-blue-600"
                            >
                              <Pencil size={14} />
                            </button>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        {row.fieldDuty.map((visit, index) => (
                          <span key={`${visit.outTime}-${index}`} className={VISIT_TAG}>
                            <MapPin size={10} className="mr-1 inline" aria-hidden />
                            {visitLabel(visit)}
                          </span>
                        ))}
                      </td>
                      <td className="px-3 py-3">
                        {row.leaveName ? (
                          <span className={LEAVE_TAG}>
                            <CalendarCheck size={10} className="mr-1 inline" aria-hidden />
                            {row.leaveName}
                          </span>
                        ) : null}
                        {row.holidayLabel ? (
                          <span className={HOLIDAY_TAG}>
                            <Umbrella size={10} className="mr-1 inline" aria-hidden />
                            {row.holidayLabel}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`status-pill shadow-sm ${statusClass(row.status)}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        {row.punctualityTags.length === 0 ? (
                          <span className="text-sm text-slate-500">-</span>
                        ) : (
                          row.punctualityTags.map((tag) => (
                            <span key={tag} className={`mb-1 mr-1 inline-block ${tagClass(tag)}`}>
                              {tag}
                            </span>
                          ))
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={edit !== null}
        title="Edit Punch Times"
        onClose={() => setEdit(null)}
        footer={
          <>
            <Button variant="outline" onClick={() => setEdit(null)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" form="edit-punch-form" loading={saving}>
              Save Changes
            </Button>
          </>
        }
      >
        {edit ? (
          <form
            id="edit-punch-form"
            onSubmit={(event) => void saveEdit(event)}
            className="space-y-3"
          >
            <div>
              <div className="text-xs font-bold text-slate-500">Employee</div>
              <div className="font-bold text-slate-900">
                {edit.employeeName} ({edit.employeeCode})
              </div>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-500">Date</div>
              <div className="font-bold text-blue-600">{edit.date}</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="In Time"
                type="time"
                step={1}
                value={edit.inTime}
                onChange={(event) =>
                  setEdit((current) =>
                    current ? { ...current, inTime: event.target.value } : current,
                  )
                }
              />
              <Input
                label="Out Time"
                type="time"
                step={1}
                value={edit.outTime}
                onChange={(event) =>
                  setEdit((current) =>
                    current ? { ...current, outTime: event.target.value } : current,
                  )
                }
              />
            </div>
            <small className="block text-slate-500">
              Updates will be applied locally and synced to remote MSSQL.
            </small>
          </form>
        ) : null}
      </Modal>
    </div>
  );
}

function SortableHeader({
  label,
  onClick,
  align = "left",
}: {
  label: string;
  onClick: () => void;
  align?: "left" | "center";
}) {
  return (
    <th className={`border-0 px-3 py-3 ${align === "center" ? "text-center" : "pl-4"}`}>
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-1 hover:text-slate-800"
      >
        {label}
        <ArrowUpDown size={11} className="text-slate-400" aria-hidden />
      </button>
    </th>
  );
}

const VISIT_TAG =
  "mt-0.5 block rounded border border-indigo-200 bg-indigo-50 px-1.5 py-0.5 text-[10px] text-indigo-700";
const LEAVE_TAG =
  "mt-0.5 block rounded border border-orange-100 bg-orange-50 px-1.5 py-0.5 text-[10px] text-orange-800";
const HOLIDAY_TAG =
  "mt-0.5 block rounded border border-green-200 bg-green-50 px-1.5 py-0.5 text-[10px] text-green-700";

function statusClass(status: string): string {
  if (status === "Holiday + Present") {
    return "bg-[#ffc107] text-slate-900";
  }

  if (status === "Present") {
    return "bg-[#198754] text-white";
  }

  if (status === "Holiday") {
    return "bg-[#0dcaf0] text-white";
  }

  return "bg-[#f8f9fa] text-slate-500";
}

function tagClass(tag: string): string {
  if (tag.startsWith("Late Arrival")) {
    return "rounded bg-red-600 px-2 py-0.5 text-xs text-white";
  }

  if (tag.startsWith("Early Logout")) {
    return "rounded bg-[#ffc107] px-2 py-0.5 text-xs text-slate-900";
  }

  return "rounded border border-slate-200 bg-[#f8f9fa] px-2 py-0.5 text-xs text-emerald-600";
}

function hasPunch(row: AttendanceReportRow): boolean {
  return Boolean(row.inTime || row.outTime);
}

function officePunchText(row: AttendanceReportRow): string {
  if (!hasPunch(row)) {
    return "-";
  }

  return `${row.inTime ?? "--:--:--"} - ${row.outTime ?? "--:--:--"} ${row.duration ?? ""}`.trim();
}

function fieldDutyText(row: AttendanceReportRow): string {
  return row.fieldDuty.map(visitLabel).join(" | ");
}

function leaveHolidayText(row: AttendanceReportRow): string {
  return [row.leaveName, row.holidayLabel].filter(Boolean).join(" ");
}

function punctualityText(row: AttendanceReportRow): string {
  return row.punctualityTags.length > 0 ? row.punctualityTags.join(" ") : "-";
}

function visitLabel(visit: AttendanceReportRow["fieldDuty"][number]): string {
  const type = visit.visitType
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  return `${type} (${visit.outTime}-${visit.inTime || "..."})`;
}

function sortValue(row: AttendanceReportRow, column: number): string {
  if (column === 0) {
    return `${row.employeeName} ${row.employeeCode}`;
  }

  if (column === 1) {
    return formatReportDate(row.date);
  }

  if (column === 5) {
    return row.status;
  }

  return punctualityText(row);
}

function formatReportDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return value;
  }

  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "2-digit",
  });
}

function toTimeInput(value: string | null): string {
  return value ? value.slice(0, 8) : "";
}

function csvCell(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}

const PRINT_CSS = `
.status-pill { font-size: 10px; padding: 4px 10px; border-radius: 50px; font-weight: 600; display: inline-block; }
@media print {
  aside, header, footer { display: none !important; }
  .report-no-print { display: none !important; }
  main { padding: 0 !important; background: #fff !important; }
  .min-h-screen > div { padding-left: 0 !important; }
}
`;
