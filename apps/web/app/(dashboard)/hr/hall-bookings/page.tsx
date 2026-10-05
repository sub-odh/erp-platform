"use client";

import { ChevronDown, Plus, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

import { Select } from "@/components/ui";
import { getMyEmployee } from "@/lib/employees";
import {
  cancelHallBooking,
  createHallBooking,
  getHallBookings,
  getHalls,
} from "@/lib/halls";
import type { HallArrangement, HallBooking, MeetingHall } from "@/types/hall";

const ARRANGEMENTS: { value: HallArrangement; label: string }[] = [
  { value: "BOARDROOM", label: "Boardroom" },
  { value: "U_SHAPE", label: "U-Shape" },
  { value: "THEATER", label: "Theater" },
  { value: "CLASSROOM", label: "Classroom" },
];

const PAGE_SIZES = [10, 25, 50, 100];

type SortColumn = "requestor" | "hall" | "reason" | "schedule" | "status";

export default function HallBookingsPage() {
  const [halls, setHalls] = useState<MeetingHall[]>([]);
  const [bookings, setBookings] = useState<HallBooking[]>([]);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<HallBooking | null>(null);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ column: SortColumn; direction: "asc" | "desc" }>({
    column: "schedule",
    direction: "desc",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [hallRows, bookingRows, me] = await Promise.all([
        getHalls(),
        getHallBookings(),
        getMyEmployee().catch(() => null),
      ]);
      setHalls(hallRows.filter((hall) => hall.status === "ACTIVE"));
      setBookings(bookingRows);
      setEmployeeId(me?.id ?? null);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load hall bookings.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = bookings.filter((row) => !query || rowText(row).includes(query));
    const direction = sort.direction === "asc" ? 1 : -1;

    return [...filtered].sort((left, right) => {
      const a = sortValue(left, sort.column);
      const b = sortValue(right, sort.column);
      return a < b ? -direction : a > b ? direction : 0;
    });
  }, [bookings, search, sort]);

  const filtered = search.trim().length > 0 && rows.length !== bookings.length;
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageRows = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const from = rows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, rows.length);

  async function handleCreate(payload: {
    hallId: string;
    bookingDate: string;
    startTime: string;
    endTime: string;
    reason: string;
  }) {
    if (payload.startTime >= payload.endTime) {
      setError("End time must be after start time");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await createHallBooking(payload);
      setFormOpen(false);
      await load();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to book the meeting hall.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel() {
    if (!cancelTarget) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await cancelHallBooking(cancelTarget.id);
      setCancelTarget(null);
      await load();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to cancel this booking.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function toggleSort(column: SortColumn) {
    setSort((current) =>
      current.column === column && current.direction === "asc"
        ? { column, direction: "desc" }
        : { column, direction: "asc" },
    );
    setPage(1);
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="mb-0 text-2xl font-bold text-slate-900">
            Meeting Hall Reservation
          </h1>
          <p className="mb-0 text-sm text-slate-500">Check availability and book rooms</p>
        </div>
        <button
          type="button"
          className="rounded-full bg-[#0d6efd] px-4 py-2 text-sm text-white shadow-sm hover:bg-[#0b5ed7]"
          onClick={() => setFormOpen(true)}
        >
          <Plus size={14} className="mr-2 inline" />
          New Request
        </button>
      </div>

      {error ? (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {loading && halls.length === 0
          ? null
          : halls.map((hall) => (
              <HallCard
                key={hall.id}
                hall={hall}
                occupied={isOccupied(hall.id, bookings)}
              />
            ))}
      </div>

      <section className="overflow-hidden rounded-3xl bg-white shadow-sm">
        <div className="bg-white px-4 py-3">
          <h2 className="text-base font-bold text-slate-900">Recent Requests & Bookings</h2>
        </div>
        <div className="px-3 pb-3">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3 text-sm">
            <label className="inline-flex items-center gap-2">
              Show
              <span className="relative">
                <select
                  value={pageSize}
                  onChange={(event) => {
                    setPageSize(Number(event.target.value));
                    setPage(1);
                  }}
                  className="appearance-none rounded border border-slate-300 bg-white py-1 pl-2 pr-8"
                >
                  {PAGE_SIZES.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-700"
                />
              </span>
              entries
            </label>
            <label>
              Search:
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                className="ml-2 rounded border border-slate-300 px-2 py-1"
              />
            </label>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#f8f9fa]">
                <tr>
                  <SortHeader label="Requestor" onClick={() => toggleSort("requestor")} />
                  <SortHeader label="Hall" onClick={() => toggleSort("hall")} />
                  <SortHeader label="Reason" onClick={() => toggleSort("reason")} />
                  <SortHeader label="Schedule" onClick={() => toggleSort("schedule")} />
                  <SortHeader label="Status" onClick={() => toggleSort("status")} />
                  <th className="px-3 py-2 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-3 text-center text-slate-500">
                      {search.trim()
                        ? "No matching records found"
                        : "No data available in table"}
                    </td>
                  </tr>
                ) : null}
                {pageRows.map((row) => {
                  const status = displayStatus(row);
                  const mine = employeeId !== null && row.employeeId === employeeId;
                  const canCancel =
                    mine &&
                    !hasPassed(row) &&
                    (row.status === "CONFIRMED" || row.status === "PENDING");

                  return (
                    <tr key={row.id} className="border-t border-slate-100 hover:bg-black/[0.03]">
                      <td className="px-3 py-2">
                        <div className="font-bold text-slate-900">
                          {row.employeeName || "Unknown"}
                        </div>
                        {mine ? (
                          <span className="rounded border border-[#9ec5fe] bg-[#cfe2ff] px-1.5 text-[0.65rem] font-semibold text-[#0d6efd]">
                            MY REQUEST
                          </span>
                        ) : null}
                      </td>
                      <td className="px-3 py-2">{row.hallName}</td>
                      <td className="px-3 py-2">
                        <small className="text-slate-500">{row.reason}</small>
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-xs font-bold">{row.bookingDate}</span>
                        <br />
                        <span className="text-xs text-slate-500">
                          {formatClock(row.startTime)} - {formatClock(row.endTime)}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${statusClass(status)}`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        {canCancel ? (
                          <button
                            type="button"
                            className="rounded-full border border-[#dc3545] px-3 py-1 text-xs text-[#dc3545]"
                            onClick={() => setCancelTarget(row)}
                          >
                            Cancel
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600">
            <span>
              Showing {from} to {to} of {rows.length} entries
              {filtered ? ` (filtered from ${bookings.length} total entries)` : ""}
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                className="rounded border border-slate-300 px-2 py-1 disabled:opacity-40"
                disabled={currentPage <= 1}
                onClick={() => setPage(currentPage - 1)}
              >
                Previous
              </button>
              <span className="rounded border border-[#0d6efd] bg-[#0d6efd] px-2 py-1 text-white">
                {currentPage}
              </span>
              <button
                type="button"
                className="rounded border border-slate-300 px-2 py-1 disabled:opacity-40"
                disabled={currentPage >= pageCount}
                onClick={() => setPage(currentPage + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </section>

      {formOpen ? (
        <RequestModal
          halls={halls}
          submitting={submitting}
          onClose={() => setFormOpen(false)}
          onSubmit={handleCreate}
        />
      ) : null}

      {cancelTarget ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-lg">
            <h2 className="text-lg font-bold">Are you sure you want to cancel this booking?</h2>
            <p className="mt-2 text-sm text-slate-600">
              {cancelTarget.hallName} · {cancelTarget.bookingDate}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="rounded bg-[#f8f9fa] px-3 py-1 text-sm"
                onClick={() => setCancelTarget(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                className="rounded bg-[#dc3545] px-3 py-1 text-sm text-white disabled:opacity-60"
                onClick={() => void handleCancel()}
              >
                Cancel Booking
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function HallCard({ hall, occupied }: { hall: MeetingHall; occupied: boolean }) {
  const seats = Math.min(hall.capacity ?? 0, 12);
  const arrangement =
    ARRANGEMENTS.find((item) => item.value === hall.arrangementType)?.label ??
    hall.arrangementType;

  return (
    <article className="relative rounded-[15px] bg-white p-3 shadow-sm">
      <span
        className={`absolute right-3 top-3 rounded-full px-[10px] py-[3px] text-[9px] font-bold ${occupied ? "bg-[#f8d7da] text-[#dc3545]" : "bg-[#d1e7dd] text-[#198754]"}`}
      >
        {occupied ? "OCCUPIED" : "AVAILABLE"}
      </span>
      <h2 className="mb-0 max-w-[75%] truncate text-base font-bold text-slate-900">
        {hall.hallName}
      </h2>
      <p className="text-xs text-slate-500">{hall.location}</p>
      <div className="relative my-3 flex h-20 items-center justify-center rounded-xl border border-dashed border-[#cbd5e1] bg-[#f8fafc]">
        <div className="flex flex-wrap justify-center p-2">
          {Array.from({ length: seats }).map((_, index) => (
            <span
              key={index}
              className="m-0.5 h-[5px] w-[5px] rounded-full bg-[#94a3b8] opacity-40"
            />
          ))}
        </div>
        <div className="absolute flex h-[18px] w-[45%] items-center justify-center rounded bg-[#475569] text-[8px] font-bold text-white">
          {arrangement}
        </div>
      </div>
      <div className="flex justify-between border-t border-slate-200 pt-2 text-xs">
        <span className="text-slate-500">
          Seats: <b className="text-slate-900">{hall.capacity ?? 0}</b>
        </span>
        <span className="font-bold text-[#0d6efd]">Active</span>
      </div>
    </article>
  );
}

function RequestModal({
  halls,
  submitting,
  onClose,
  onSubmit,
}: {
  halls: MeetingHall[];
  submitting: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    hallId: string;
    bookingDate: string;
    startTime: string;
    endTime: string;
    reason: string;
  }) => void;
}) {
  const today = isoDate(new Date());
  const [hallId, setHallId] = useState(halls[0]?.id ?? "");
  const [bookingDate, setBookingDate] = useState(today);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [reason, setReason] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit({
      hallId,
      bookingDate,
      startTime,
      endTime,
      reason: reason.trim(),
    });
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4">
      <form className="w-full max-w-[500px] overflow-hidden rounded bg-white shadow-lg" onSubmit={handleSubmit}>
        <div className="flex items-center justify-between bg-[#0d6efd] px-4 py-3 text-white">
          <h2 className="text-lg font-bold">Request Room</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-white">
            <X size={16} />
          </button>
        </div>
        <div className="space-y-3 p-4">
          <div>
            <span className="mb-2 block text-xs font-bold">Select Hall</span>
            <Select
              required
              value={hallId}
              onChange={(event) => setHallId(event.target.value)}
            >
              {halls.map((hall) => (
                <option key={hall.id} value={hall.id}>
                  {hall.hallName} (Cap: {hall.capacity ?? 0})
                </option>
              ))}
            </Select>
          </div>
          <label className="block text-xs font-bold">
            Date
            <input
              type="date"
              required
              min={today}
              value={bookingDate}
              onChange={(event) => setBookingDate(event.target.value)}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm font-normal"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-bold">
              Start Time
              <input
                type="time"
                required
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm font-normal"
              />
            </label>
            <label className="block text-xs font-bold">
              End Time
              <input
                type="time"
                required
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm font-normal"
              />
            </label>
          </div>
          <label className="block text-xs font-bold">
            Reason for Meeting
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Topic/Agenda..."
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm font-normal"
            />
          </label>
        </div>
        <div className="px-4 pb-4">
          <button
            type="submit"
            disabled={submitting || halls.length === 0}
            className="w-full rounded-full bg-[#0d6efd] py-2 text-sm font-bold text-white disabled:opacity-60"
          >
            Submit Booking Request
          </button>
        </div>
      </form>
    </div>
  );
}

function SortHeader({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <th className="cursor-pointer px-3 py-2 font-semibold" onClick={onClick}>
      {label}
      <span className="ml-1 text-[0.7rem] opacity-30">↕</span>
    </th>
  );
}

function isOccupied(hallId: string, bookings: HallBooking[]): boolean {
  const now = new Date();
  const today = isoDate(now);
  const clock = clockStamp(now);

  return bookings.some((row) => {
    if (row.hallId !== hallId || row.status !== "CONFIRMED" || row.bookingDate !== today) {
      return false;
    }

    return padTime(row.startTime) <= clock && clock <= padTime(row.endTime);
  });
}

function hasPassed(row: HallBooking): boolean {
  return Date.now() > new Date(`${row.bookingDate}T${padTime(row.endTime)}`).getTime();
}

function displayStatus(row: HallBooking): string {
  if (row.status === "CONFIRMED" && hasPassed(row)) {
    return "Completed";
  }

  if (row.status === "CONFIRMED") {
    return "Confirmed";
  }

  if (row.status === "PENDING") {
    return "Pending";
  }

  return "Cancelled";
}

function statusClass(status: string): string {
  if (status === "Confirmed") {
    return "border-[#a3cfbb] bg-[#d1e7dd] text-[#198754]";
  }

  if (status === "Completed") {
    return "border-[#9eeaf9] bg-[#cff4fc] text-[#0dcaf0]";
  }

  if (status === "Pending") {
    return "border-[#ffe69c] bg-[#fff3cd] text-[#ffc107]";
  }

  return "border-[#f1aeb5] bg-[#f8d7da] text-[#dc3545]";
}

function rowText(row: HallBooking): string {
  return [
    row.employeeName,
    row.hallName,
    row.reason ?? "",
    row.bookingDate,
    formatClock(row.startTime),
    formatClock(row.endTime),
    displayStatus(row),
  ]
    .join(" ")
    .toLowerCase();
}

function sortValue(row: HallBooking, column: SortColumn): string {
  if (column === "requestor") {
    return (row.employeeName || "Unknown").toLowerCase();
  }

  if (column === "hall") {
    return row.hallName.toLowerCase();
  }

  if (column === "reason") {
    return (row.reason ?? "").toLowerCase();
  }

  if (column === "status") {
    return displayStatus(row).toLowerCase();
  }

  return `${row.bookingDate} ${padTime(row.startTime)}`;
}

function formatClock(value: string): string {
  const [hourText, minute = "00"] = padTime(value).split(":");
  let hours = Number(hourText);
  const suffix = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${String(hours).padStart(2, "0")}:${minute} ${suffix}`;
}

function padTime(value: string): string {
  const [hours = "00", minutes = "00", seconds = "00"] = value.split(":");
  return `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}:${seconds.padStart(2, "0")}`;
}

function isoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function clockStamp(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}:${String(date.getSeconds()).padStart(2, "0")}`;
}
