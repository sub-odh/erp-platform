"use client";

import { Clock3, Plus, Search } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";

import { Badge, Button, Input, Modal, Select, Spinner } from "@/components/ui";
import {
  attendanceEmployeeName,
  attendanceStatusVariant,
  createAttendance,
  currentMonthRange,
  formatAttendanceDate,
  formatAttendanceTime,
  getAttendance,
  todayIsoDate,
} from "@/lib/attendance";
import { employeeFullName, getEmployeeDirectory } from "@/lib/employees";
import type { AttendanceRecord } from "@/types/attendance";
import type { EmployeeDirectoryItem } from "@/types/employee";

const monthRange = currentMonthRange();

export default function AttendanceManagementPage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [directory, setDirectory] = useState<EmployeeDirectoryItem[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState(monthRange.startDate);
  const [endDate, setEndDate] = useState(monthRange.endDate);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
        limit: 20,
      });

      setRecords(result.data);
      setTotal(result.pagination.total);
      setTotalPages(Math.max(result.pagination.totalPages, 1));
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

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setPage(1);
    setSearchQuery(searchInput.trim());
  }

  function applyToday(): void {
    const today = todayIsoDate();
    setStartDate(today);
    setEndDate(today);
    setPage(1);
  }

  function applyMonth(): void {
    const range = currentMonthRange();
    setStartDate(range.startDate);
    setEndDate(range.endDate);
    setPage(1);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Clock3 size={20} />
          </div>
          <div>
            <p className="text-sm font-medium text-blue-600">HR & Operations</p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Attendance Management
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Review office punches and record a missing in or out time.
            </p>
          </div>
        </div>

        <Button onClick={openCreate}>
          <Plus size={17} />
          Record Punch
        </Button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <form
          onSubmit={handleSearchSubmit}
          className="flex flex-col gap-3 lg:flex-row lg:items-end"
        >
          <div className="min-w-0 flex-1">
            <div className="relative">
              <Search
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search by employee name or code"
                className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
          <Input
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(event) => {
              setStartDate(event.target.value);
              setPage(1);
            }}
          />
          <Input
            label="End Date"
            type="date"
            value={endDate}
            onChange={(event) => {
              setEndDate(event.target.value);
              setPage(1);
            }}
          />
          <div className="flex flex-wrap gap-2">
            <Button type="submit">Search</Button>
            <Button type="button" variant="outline" onClick={applyToday}>
              Today
            </Button>
            <Button type="button" variant="outline" onClick={applyMonth}>
              1 Month
            </Button>
          </div>
        </form>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading && records.length === 0 ? (
        <div className="flex min-h-64 items-center justify-center rounded-xl border border-slate-200 bg-white">
          <Spinner />
        </div>
      ) : records.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <p className="text-sm font-medium text-slate-700">
            No attendance records
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Record a punch or adjust the search and date range.
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
                  <th className="px-4 py-3">In</th>
                  <th className="px-4 py-3">Out</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((record) => (
                  <tr key={record.id} className="bg-white">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">
                        {attendanceEmployeeName(record)}
                      </div>
                      <div className="font-mono text-xs text-slate-500">
                        {record.employeeCode}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatAttendanceDate(record.punchDate)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatAttendanceTime(record.inTime)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatAttendanceTime(record.outTime)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {record.duration ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={attendanceStatusVariant(record.attStatus)}>
                        {record.attStatus}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          {total === 0
            ? "No punches"
            : `${total} punch${total === 1 ? "" : "es"} · Page ${page} of ${totalPages}`}
        </p>
        {totalPages > 1 ? (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              disabled={page <= 1 || loading}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
            </Button>
          </div>
        ) : null}
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
