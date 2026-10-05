"use client";

import { FileSpreadsheet, FileText, Plus, X } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";

import { Button, Input, Modal, Select, Spinner } from "@/components/ui";
import {
  attendanceEmployeeName,
  createAttendance,
  currentMonthRange,
  getAttendance,
  todayIsoDate,
} from "@/lib/attendance";
import { employeeFullName, getEmployeeDirectory } from "@/lib/employees";
import type { AttendanceRecord } from "@/types/attendance";
import type { EmployeeDirectoryItem } from "@/types/employee";

const PAGE_SIZE = 20;
const MSSQL_UNAVAILABLE =
  "MSSQL connection driver unavailable. Showing cached local logs.";

const monthRange = currentMonthRange();

export default function AttendanceManagementPage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [directory, setDirectory] = useState<EmployeeDirectoryItem[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [startInput, setStartInput] = useState(monthRange.startDate);
  const [endInput, setEndInput] = useState(monthRange.endDate);
  const [startDate, setStartDate] = useState(monthRange.startDate);
  const [endDate, setEndDate] = useState(monthRange.endDate);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [exporting, setExporting] = useState<"csv" | "pdf" | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [employeeId, setEmployeeId] = useState("");
  const [punchDate, setPunchDate] = useState(todayIsoDate());
  const [inTime, setInTime] = useState("");
  const [outTime, setOutTime] = useState("");

  const loadRecords = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const result = await getAttendance({
        search: searchQuery || undefined,
        startDate,
        endDate,
        page,
        limit: PAGE_SIZE,
      });

      setRecords(result.data);
      setTotal(result.pagination.total);
      setTotalPages(result.pagination.totalPages);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load attendance.",
      );
    } finally {
      setLoading(false);
    }
  }, [endDate, page, searchQuery, startDate]);

  useEffect(() => {
    void getEmployeeDirectory()
      .then(setDirectory)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    void loadRecords();
  }, [loadRecords]);

  function applyFilter(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setPage(1);
    setSearchQuery(searchInput.trim());
    setStartDate(startInput);
    setEndDate(endInput);
  }

  function applyToday(): void {
    const today = todayIsoDate();
    setSearchInput("");
    setSearchQuery("");
    setStartInput(today);
    setEndInput(today);
    setStartDate(today);
    setEndDate(today);
    setPage(1);
  }

  function applyMonth(): void {
    const range = currentMonthRange();
    setSearchInput("");
    setSearchQuery("");
    setStartInput(range.startDate);
    setEndInput(range.endDate);
    setStartDate(range.startDate);
    setEndDate(range.endDate);
    setPage(1);
  }

  function runSync(): void {
    setSyncing(true);
    window.setTimeout(() => {
      setSyncing(false);
      setSyncMessage(MSSQL_UNAVAILABLE);
    }, 400);
  }

  function openCreate(): void {
    setEmployeeId("");
    setPunchDate(todayIsoDate());
    setInTime("");
    setOutTime("");
    setFormOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await createAttendance({
        employeeId,
        punchDate,
        inTime: inTime || undefined,
        outTime: outTime || undefined,
      });
      setFormOpen(false);
      await loadRecords();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to record this punch.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function exportRows(kind: "csv" | "pdf"): Promise<void> {
    setExporting(kind);
    setError(null);

    try {
      const rows = await loadAllAttendance(searchQuery, startDate, endDate);

      if (kind === "csv") {
        downloadCsv(rows);
      } else {
        await downloadPdf(rows);
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to export attendance.",
      );
    } finally {
      setExporting(null);
    }
  }

  const offset = (page - 1) * PAGE_SIZE;
  const showingFrom = offset + 1;
  const showingTo = Math.min(offset + PAGE_SIZE, total);
  const nextDisabled = page >= totalPages || totalPages === 0;

  return (
    <div>
      {syncing ? (
        <div className="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-white/80">
          <Spinner />
          <h2 className="mt-3 text-lg font-bold text-slate-900">
            Synchronizing MSSQL Data...
          </h2>
        </div>
      ) : null}

      {syncMessage ? (
        <div className="mb-4 flex items-start justify-between gap-3 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
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

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="mb-0 text-2xl font-bold text-slate-900">
            Attendance Management
          </h1>
          <small className="text-slate-500">Last Sync: —</small>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <div className="inline-flex overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
            <button
              type="button"
              onClick={() => void exportRows("csv")}
              disabled={exporting !== null}
              className="inline-flex items-center border-r border-slate-200 px-3 py-1 text-sm text-slate-800 hover:bg-slate-50 disabled:opacity-60"
            >
              <FileSpreadsheet size={14} className="mr-1 text-emerald-600" aria-hidden />
              CSV
            </button>
            <button
              type="button"
              onClick={() => void exportRows("pdf")}
              disabled={exporting !== null}
              className="inline-flex items-center px-3 py-1 text-sm text-slate-800 hover:bg-slate-50 disabled:opacity-60"
            >
              <FileText size={14} className="mr-1 text-red-600" aria-hidden />
              PDF
            </button>
          </div>
          <div className="inline-flex overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
            <button
              type="button"
              onClick={applyToday}
              className="border-r border-slate-200 px-3 py-1 text-sm text-slate-800 hover:bg-slate-50"
            >
              Today
            </button>
            <button
              type="button"
              onClick={applyMonth}
              className="px-3 py-1 text-sm text-slate-800 hover:bg-slate-50"
            >
              1 Month
            </button>
          </div>
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
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center rounded-full bg-blue-600 px-3 py-1 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            <Plus size={14} className="mr-1" aria-hidden />
            Record Punch
          </button>
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="bg-white px-4 py-3">
          <form
            onSubmit={applyFilter}
            className="grid grid-cols-1 gap-2 md:grid-cols-12"
          >
            <div className="md:col-span-4">
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search name or ID..."
                className="h-9 w-full rounded-md border-2 border-[#0d6efd] px-3 text-sm text-slate-900 shadow-[0_0_5px_rgba(13,110,253,0.2)] outline-none placeholder:text-slate-400"
              />
            </div>
            <div className="md:col-span-3">
              <input
                type="date"
                value={startInput}
                onChange={(event) => setStartInput(event.target.value)}
                aria-label="Start Date"
                className="h-9 w-full rounded-md border-0 bg-slate-100 px-3 text-sm text-slate-900 outline-none"
              />
            </div>
            <div className="md:col-span-3">
              <input
                type="date"
                value={endInput}
                onChange={(event) => setEndInput(event.target.value)}
                aria-label="End Date"
                className="h-9 w-full rounded-md border-0 bg-slate-100 px-3 text-sm text-slate-900 outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                className="h-9 w-full rounded-full bg-blue-600 text-sm text-white hover:bg-blue-700"
              >
                Apply Filter
              </button>
            </div>
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="mb-0 w-full border-collapse text-left align-middle text-sm">
            <thead>
              <tr className="bg-[#f8f9fa] text-[11px] font-bold uppercase text-[#6c757d]">
                <th className="border-0 py-3 pl-4 pr-3">Employee</th>
                <th className="border-0 px-3 py-3">Date</th>
                <th className="border-0 px-3 py-3">In Time</th>
                <th className="border-0 px-3 py-3">Out Time</th>
                <th className="border-0 px-3 py-3">Duration</th>
                <th className="border-0 px-3 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading && records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <Spinner />
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="py-3 pl-4 pr-3">
                      <div className="font-bold text-slate-900">
                        {attendanceEmployeeName(record)}
                      </div>
                      <small className="text-slate-500">{record.employeeCode}</small>
                    </td>
                    <td className="px-3 py-3 text-sm text-slate-700">
                      {formatPunchDate(record.punchDate)}
                    </td>
                    <td className="px-3 py-3">
                      <span className="inline-block rounded bg-[#e3f2fd] px-2 py-1 text-[#0d6efd]">
                        {record.inTime ?? ""}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="inline-block rounded bg-[#fff3e0] px-2 py-1 text-[#ef6c00]">
                        {formatOutTime(record.outTime)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-sm font-bold text-slate-500">
                      {formatDuration(record.duration)}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${statusClass(record.attStatus)}`}
                      >
                        {record.attStatus}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <small className="text-slate-500">
            Showing {showingFrom} to {showingTo} of {total} entries
          </small>
          <nav aria-label="Attendance pages">
            <ul className="mb-0 flex items-center">
              <PagerLink
                label="Previous"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              />
              <PagerLink
                label="1"
                active={page === 1}
                onClick={() => setPage(1)}
              />
              {totalPages >= 2 ? (
                <PagerLink
                  label="2"
                  active={page === 2}
                  onClick={() => setPage(2)}
                />
              ) : null}
              <PagerLink
                label="Next"
                disabled={nextDisabled}
                onClick={() => setPage((current) => current + 1)}
              />
            </ul>
          </nav>
        </div>
      </div>

      <Modal
        open={formOpen}
        title="Record Punch"
        description="Enter an employee and the in or out time for a single date."
        onClose={() => setFormOpen(false)}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setFormOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" form="record-punch-form" loading={submitting}>
              Save Punch
            </Button>
          </>
        }
      >
        <form
          id="record-punch-form"
          onSubmit={(event) => void handleSubmit(event)}
          className="space-y-4"
        >
          <Select
            label="Employee"
            required
            value={employeeId}
            onChange={(event) => setEmployeeId(event.target.value)}
          >
            <option value="">Select Employee</option>
            {directory.map((item) => (
              <option key={item.id} value={item.id}>
                {employeeFullName(item)} ({item.employeeCode})
              </option>
            ))}
          </Select>
          <Input
            label="Date"
            type="date"
            required
            value={punchDate}
            onChange={(event) => setPunchDate(event.target.value)}
          />
          <Input
            label="In Time"
            type="time"
            value={inTime}
            onChange={(event) => setInTime(event.target.value)}
          />
          <Input
            label="Out Time"
            type="time"
            value={outTime}
            onChange={(event) => setOutTime(event.target.value)}
          />
        </form>
      </Modal>
    </div>
  );
}

function PagerLink({
  label,
  active = false,
  disabled = false,
  onClick,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <li className="mx-0.5">
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className={`rounded-lg px-3 py-1.5 text-[13px] font-semibold ${
          active
            ? "bg-[#0d6efd] text-white"
            : "text-[#6c757d] hover:bg-slate-100"
        } disabled:cursor-not-allowed disabled:opacity-40`}
      >
        {label}
      </button>
    </li>
  );
}

function statusClass(status: string): string {
  return status.includes("Absent")
    ? "bg-[#ffebee] text-[#c62828]"
    : "bg-[#e8f5e9] text-[#2e7d32]";
}

function formatOutTime(value: string | null): string {
  if (!value || value === "00:00:00" || value === "00:00") {
    return "--:--";
  }

  return value;
}

function formatDuration(value: string | null): string {
  if (!value) {
    return "";
  }

  const clock = value.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);

  if (clock) {
    return `${clock[1].padStart(2, "0")}:${clock[2]}`;
  }

  const words = value.match(/^(?:(\d+)h)?(?:\s*(\d+)m)?$/);

  if (words && (words[1] || words[2])) {
    return `${(words[1] ?? "0").padStart(2, "0")}:${(words[2] ?? "0").padStart(2, "0")}`;
  }

  return value;
}

function formatPunchDate(value: string): string {
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

async function loadAllAttendance(
  search: string,
  startDate: string,
  endDate: string,
): Promise<AttendanceRecord[]> {
  const first = await getAttendance({
    search: search || undefined,
    startDate,
    endDate,
    page: 1,
    limit: 100,
  });
  const rows = [...first.data];

  for (let page = 2; page <= first.pagination.totalPages; page += 1) {
    const next = await getAttendance({
      search: search || undefined,
      startDate,
      endDate,
      page,
      limit: 100,
    });
    rows.push(...next.data);
  }

  return rows;
}

function downloadCsv(rows: AttendanceRecord[]): void {
  const header = [
    "Employee",
    "Code",
    "Date",
    "In Time",
    "Out Time",
    "Duration",
    "Status",
  ];
  const lines = [
    header,
    ...rows.map((row) => [
      attendanceEmployeeName(row),
      row.employeeCode,
      row.punchDate,
      row.inTime ?? "",
      row.outTime ?? "",
      formatDuration(row.duration),
      row.attStatus,
    ]),
  ];
  const csv = lines
    .map((cells) => cells.map(csvCell).join(","))
    .join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "Attendance_Full_Report.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function csvCell(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}

async function downloadPdf(rows: AttendanceRecord[]): Promise<void> {
  const { default: html2pdf } = await import("html2pdf.js");
  const table = document.createElement("table");
  table.innerHTML = `<thead><tr><th>Employee</th><th>Code</th><th>Date</th><th>In Time</th><th>Out Time</th><th>Duration</th><th>Status</th></tr></thead><tbody>${rows
    .map(
      (row) =>
        `<tr><td>${escapeHtml(attendanceEmployeeName(row))}</td><td>${escapeHtml(row.employeeCode)}</td><td>${escapeHtml(row.punchDate)}</td><td>${escapeHtml(row.inTime ?? "")}</td><td>${escapeHtml(row.outTime ?? "")}</td><td>${escapeHtml(formatDuration(row.duration))}</td><td>${escapeHtml(row.attStatus)}</td></tr>`,
    )
    .join("")}</tbody>`;
  table.style.position = "fixed";
  table.style.left = "-10000px";
  table.style.top = "0";
  table.style.background = "#fff";
  document.body.appendChild(table);

  try {
    await html2pdf()
      .set({
        margin: 0.5,
        filename: "Attendance_Full_Report.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "in", format: "letter", orientation: "landscape" },
      })
      .from(table)
      .save();
  } finally {
    table.remove();
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
