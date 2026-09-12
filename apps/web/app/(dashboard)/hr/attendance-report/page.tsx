"use client";

import { ClipboardList, Printer, Search } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";

import { Badge, Button, Input, Spinner } from "@/components/ui";
import {
  attendanceStatusVariant,
  currentMonthRange,
  formatAttendanceDate,
  formatAttendanceTime,
  getAttendanceReport,
  punctualityVariant,
  todayIsoDate,
} from "@/lib/attendance";
import type { AttendanceReportRow } from "@/types/attendance";

const monthRange = currentMonthRange();

export default function AttendanceReportPage() {
  const [rows, setRows] = useState<AttendanceReportRow[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState(monthRange.startDate);
  const [endDate, setEndDate] = useState(monthRange.endDate);
  const [excludeInput, setExcludeInput] = useState("");
  const [exclude, setExclude] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  function handleApply(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setSearchQuery(searchInput.trim());
    setExclude(excludeInput.trim());
  }

  function applyToday(): void {
    const today = todayIsoDate();
    setStartDate(today);
    setEndDate(today);
  }

  function applyMonth(): void {
    const range = currentMonthRange();
    setStartDate(range.startDate);
    setEndDate(range.endDate);
  }

  function downloadCsv(): void {
    const header = [
      "Employee",
      "Code",
      "Date",
      "In",
      "Out",
      "Field Duty",
      "Leave",
      "Holiday",
      "Status",
      "Punctuality",
    ];
    const lines = rows.map((row) =>
      [
        row.employeeName,
        row.employeeCode,
        row.date,
        row.inTime ?? "",
        row.outTime ?? "",
        formatFieldDuty(row),
        row.leaveName ?? "",
        row.holidayTitle ?? "",
        row.status,
        row.punctuality ?? "",
      ]
        .map(csvCell)
        .join(","),
    );
    const blob = new Blob([[header.join(","), ...lines].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `attendance-report-${startDate}-to-${endDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center print:hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <ClipboardList size={20} />
          </div>
          <div>
            <p className="text-sm font-medium text-blue-600">HR & Operations</p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Attendance Report
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Daily status for each active employee in the selected range.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={downloadCsv} disabled={rows.length === 0}>
            Export CSV
          </Button>
          <Button onClick={() => window.print()}>
            <Printer size={16} />
            Print
          </Button>
        </div>
      </div>

      <form
        onSubmit={handleApply}
        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm print:hidden"
      >
        <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr_auto]">
          <Input
            label="Search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Employee name or code"
            leadingIcon={<Search size={17} />}
          />
          <Input
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
          />
          <Input
            label="End Date"
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
          />
          <Input
            label="Exclude Codes"
            value={excludeInput}
            onChange={(event) => setExcludeInput(event.target.value)}
            placeholder="e.g. 007, 012"
            hint="Comma-separated employee codes"
          />
          <div className="flex flex-wrap items-end gap-2">
            <Button type="submit">Apply</Button>
            <Button type="button" variant="outline" onClick={applyToday}>
              Today
            </Button>
            <Button type="button" variant="outline" onClick={applyMonth}>
              Monthly
            </Button>
          </div>
        </div>
      </form>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 print:hidden">
          {error}
        </div>
      ) : null}

      {loading && rows.length === 0 ? (
        <div className="flex min-h-64 items-center justify-center rounded-xl border border-slate-200 bg-white">
          <Spinner />
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <p className="text-sm font-medium text-slate-700">No report rows</p>
          <p className="mt-1 text-sm text-slate-500">
            Adjust the date range, search, or excluded codes.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Office Punch</th>
                  <th className="px-4 py-3">Field Duty</th>
                  <th className="px-4 py-3">Leave / Holiday</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Punctuality</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr key={`${row.employeeId}-${row.date}`} className="bg-white">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">
                        {row.employeeName}
                      </div>
                      <div className="font-mono text-xs text-slate-500">
                        {row.employeeCode}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatAttendanceDate(row.date)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatOfficePunch(row)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatFieldDuty(row) || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatLeaveHoliday(row)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={attendanceStatusVariant(row.status)}>
                        {row.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {row.punctuality ? (
                        <Badge variant={punctualityVariant(row.punctuality)}>
                          {row.punctuality}
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function formatOfficePunch(row: AttendanceReportRow): string {
  if (!row.inTime && !row.outTime) {
    return "—";
  }

  return `${formatAttendanceTime(row.inTime)} – ${formatAttendanceTime(row.outTime)}`;
}

function formatFieldDuty(row: AttendanceReportRow): string {
  if (row.fieldDuty.length === 0) {
    return "";
  }

  return row.fieldDuty
    .map((visit) => {
      const times = `${formatAttendanceTime(visit.outTime)}–${formatAttendanceTime(visit.inTime)}`;
      return `${visit.agenda} (${times})`;
    })
    .join("; ");
}

function formatLeaveHoliday(row: AttendanceReportRow): string {
  const parts = [row.leaveName, row.holidayTitle].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "—";
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}
