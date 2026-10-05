"use client";

import { Clock, FileSpreadsheet, FileText, Plus, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

import { Select } from "@/components/ui";
import {
  cancelHallBooking,
  confirmHallBooking,
  createHall,
  getHallBookings,
  getHalls,
} from "@/lib/halls";
import type {
  HallArrangement,
  HallBooking,
  MeetingHall,
} from "@/types/hall";

const ARRANGEMENTS: { value: HallArrangement; label: string }[] = [
  { value: "BOARDROOM", label: "Boardroom" },
  { value: "U_SHAPE", label: "U-Shape" },
  { value: "THEATER", label: "Theater" },
  { value: "CLASSROOM", label: "Classroom" },
];

const PAGE_SIZE = 10;

export default function HallsPage() {
  const [halls, setHalls] = useState<MeetingHall[]>([]);
  const [bookings, setBookings] = useState<HallBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [nextHalls, nextBookings] = await Promise.all([
        getHalls(),
        getHallBookings(),
      ]);
      setHalls(nextHalls);
      setBookings(nextBookings);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load meeting halls.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const pending = useMemo(
    () =>
      bookings
        .filter((row) => row.status === "PENDING")
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
    [bookings],
  );

  const history = useMemo(() => {
    const query = search.trim().toLowerCase();

    return bookings
      .filter((row) => row.status === "CONFIRMED" || row.status === "CANCELLED")
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .filter((row) => !query || historyText(row).includes(query));
  }, [bookings, search]);

  const pageCount = Math.max(1, Math.ceil(history.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageRows = history.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const from = history.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const to = Math.min(currentPage * PAGE_SIZE, history.length);

  async function handleCreate(payload: {
    hallName: string;
    location: string;
    capacity: number;
    arrangementType: HallArrangement;
  }) {
    setSubmitting(true);
    setError(null);

    try {
      await createHall({ ...payload, status: "ACTIVE" });
      setFormOpen(false);
      await load();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save the meeting hall.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function decide(bookingId: string, action: "confirm" | "cancel") {
    setError(null);

    try {
      if (action === "confirm") {
        await confirmHallBooking(bookingId);
      } else {
        await cancelHallBooking(bookingId);
      }
      await load();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update this booking.",
      );
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="mb-0 text-2xl font-bold text-slate-900">
            Hall & Reservation Management
          </h1>
          <p className="mb-0 text-sm text-slate-500">
            Manage meeting rooms and approve employee requests
          </p>
        </div>
        <button
          type="button"
          className="rounded-full bg-[#0d6efd] px-4 py-2 text-sm text-white shadow-sm hover:bg-[#0b5ed7]"
          onClick={() => setFormOpen(true)}
        >
          <Plus size={14} className="mr-2 inline" />
          New Hall
        </button>
      </div>

      {error ? (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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

      {pending.length > 0 ? (
        <section className="mb-8 overflow-hidden rounded-3xl border-l-4 border-[#ffc107] bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-white px-4 py-3">
            <h2 className="text-base font-bold text-[#ffc107]">
              <Clock size={16} className="mr-2 inline" />
              Awaiting Approval
            </h2>
          </div>
          <div className="overflow-x-auto p-3">
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  <th className="px-3 py-2 font-semibold">Employee</th>
                  <th className="px-3 py-2 font-semibold">Hall</th>
                  <th className="px-3 py-2 font-semibold">Schedule</th>
                  <th className="px-3 py-2 font-semibold">Purpose</th>
                  <th className="px-3 py-2 text-right font-semibold">Decision</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((row) => (
                  <tr key={row.id} className="border-t border-slate-100">
                    <td className="px-3 py-2 font-bold">{row.employeeName}</td>
                    <td className="px-3 py-2">{row.hallName}</td>
                    <td className="px-3 py-2">
                      <span className="rounded bg-[#f8f9fa] px-2 py-0.5 text-xs text-slate-900">
                        {row.bookingDate}
                      </span>
                      <br />
                      <small>
                        {formatClock(row.startTime)} - {formatClock(row.endTime)}
                      </small>
                    </td>
                    <td className="px-3 py-2 text-xs">{row.reason}</td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        className="mr-1 rounded-full bg-[#198754] px-3 py-1 text-xs text-white"
                        onClick={() => void decide(row.id, "confirm")}
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        className="rounded-full border border-[#dc3545] px-3 py-1 text-xs text-[#dc3545]"
                        onClick={() => void decide(row.id, "cancel")}
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-3xl bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-white px-4 py-3">
          <h2 className="text-base font-bold text-slate-900">Booking History & Export</h2>
        </div>
        <div className="p-3">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-full bg-[#198754] px-3 py-1 text-sm text-white"
                onClick={() => void exportHistoryExcel(history)}
              >
                <FileSpreadsheet size={14} className="mr-1 inline" />
                Excel
              </button>
              <button
                type="button"
                className="rounded-full bg-[#dc3545] px-3 py-1 text-sm text-white"
                onClick={() => void exportHistoryPdf(history)}
              >
                <FileText size={14} className="mr-1 inline" />
                PDF
              </button>
            </div>
            <label className="text-sm text-slate-700">
              Search:
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                className="ml-2 rounded border border-slate-300 px-2 py-1 text-sm"
              />
            </label>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  <th className="px-3 py-2 font-semibold">Ref ID</th>
                  <th className="px-3 py-2 font-semibold">Requestor</th>
                  <th className="px-3 py-2 font-semibold">Hall</th>
                  <th className="px-3 py-2 font-semibold">Date</th>
                  <th className="px-3 py-2 font-semibold">Timing</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                  <th className="px-3 py-2 font-semibold">Reason</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row, index) => {
                  const status = displayStatus(row);

                  return (
                    <tr
                      key={row.id}
                      className={index % 2 === 0 ? "bg-black/[0.02]" : "bg-white"}
                    >
                      <td className="px-3 py-2">#{row.id.slice(0, 8)}</td>
                      <td className="px-3 py-2 font-bold">
                        {row.employeeName || "System"}
                      </td>
                      <td className="px-3 py-2">{row.hallName}</td>
                      <td className="px-3 py-2">{row.bookingDate}</td>
                      <td className="px-3 py-2">
                        <small>
                          {formatClock(row.startTime)} - {formatClock(row.endTime)}
                        </small>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(status)}`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs">{row.reason}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600">
            <span>
              Showing {from} to {to} of {history.length} entries
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
        <NewHallModal
          submitting={submitting}
          onClose={() => setFormOpen(false)}
          onSubmit={handleCreate}
        />
      ) : null}
    </div>
  );
}

function HallCard({ hall, occupied }: { hall: MeetingHall; occupied: boolean }) {
  const seats = Math.min(hall.capacity ?? 0, 14);
  const arrangement =
    ARRANGEMENTS.find((item) => item.value === hall.arrangementType)?.label ??
    hall.arrangementType;

  return (
    <article className="relative rounded-2xl bg-white p-3 shadow-sm">
      <span
        className={`absolute right-4 top-4 rounded-full px-3 py-1 text-[10px] font-bold ${occupied ? "bg-[#f8d7da] text-[#dc3545]" : "bg-[#d1e7dd] text-[#198754]"}`}
      >
        {occupied ? "● OCCUPIED" : "● AVAILABLE"}
      </span>
      <h2 className="mb-0 pr-24 text-base font-bold text-slate-900">{hall.hallName}</h2>
      <p className="text-xs text-slate-500">{hall.location}</p>
      <div className="relative my-4 flex h-[90px] items-center justify-center rounded-xl border border-[#e2e8f0] bg-[#f1f5f9]">
        <div className="flex max-w-[80%] flex-wrap justify-center p-2">
          {Array.from({ length: seats }).map((_, index) => (
            <span
              key={index}
              className="m-0.5 h-1.5 w-1.5 rounded-full bg-[#cbd5e1]"
            />
          ))}
        </div>
        <div className="absolute flex h-[22px] w-2/5 items-center justify-center rounded bg-[#64748b] text-[9px] font-bold text-white">
          {arrangement}
        </div>
      </div>
      <div className="flex justify-between border-t border-slate-200 pt-2 text-xs text-slate-500">
        <span>
          Seats: <b className="text-slate-900">{hall.capacity ?? 0}</b>
        </span>
        <span>
          Status:{" "}
          <b className="text-[#0d6efd]">
            {hall.status === "ACTIVE" ? "Active" : "Maintenance"}
          </b>
        </span>
      </div>
    </article>
  );
}

function NewHallModal({
  submitting,
  onClose,
  onSubmit,
}: {
  submitting: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    hallName: string;
    location: string;
    capacity: number;
    arrangementType: HallArrangement;
  }) => void;
}) {
  const [hallName, setHallName] = useState("");
  const [location, setLocation] = useState("");
  const [capacity, setCapacity] = useState("");
  const [arrangementType, setArrangementType] =
    useState<HallArrangement>("BOARDROOM");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit({
      hallName: hallName.trim(),
      location: location.trim(),
      capacity: Number(capacity),
      arrangementType,
    });
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4">
      <form
        className="w-full max-w-lg overflow-hidden rounded bg-white shadow-lg"
        onSubmit={handleSubmit}
      >
        <div className="flex items-center justify-between bg-[#0d6efd] px-4 py-3 text-white">
          <h2 className="text-lg font-bold">New Meeting Hall</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-white">
            <X size={16} />
          </button>
        </div>
        <div className="space-y-3 p-4">
          <label className="block text-xs font-bold">
            Hall Name
            <input
              required
              value={hallName}
              onChange={(event) => setHallName(event.target.value)}
              placeholder="Boardroom A"
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm font-normal"
            />
          </label>
          <label className="block text-xs font-bold">
            Location
            <input
              required
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="e.g. 1st Floor"
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm font-normal"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-bold">
              Capacity
              <input
                required
                type="number"
                min={1}
                value={capacity}
                onChange={(event) => setCapacity(event.target.value)}
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm font-normal"
              />
            </label>
            <Select
              label="Arrangement"
              value={arrangementType}
              onChange={(event) =>
                setArrangementType(event.target.value as HallArrangement)
              }
            >
              {ARRANGEMENTS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="px-4 pb-4">
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-[#0d6efd] py-2 text-sm font-bold text-white disabled:opacity-60"
          >
            Save Hall
          </button>
        </div>
      </form>
    </div>
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

function displayStatus(row: HallBooking): "Confirmed" | "Completed" | "Cancelled" {
  if (row.status === "CANCELLED") {
    return "Cancelled";
  }

  const end = new Date(`${row.bookingDate}T${padTime(row.endTime)}`);

  if (row.status === "CONFIRMED" && Date.now() > end.getTime()) {
    return "Completed";
  }

  return "Confirmed";
}

function statusClass(status: "Confirmed" | "Completed" | "Cancelled"): string {
  if (status === "Confirmed") {
    return "bg-[#d1e7dd] text-[#198754]";
  }

  if (status === "Completed") {
    return "bg-[#cff4fc] text-[#055160]";
  }

  return "bg-[#f8d7da] text-[#dc3545]";
}

function historyText(row: HallBooking): string {
  return [
    row.id,
    row.employeeName,
    row.hallName,
    row.bookingDate,
    formatClock(row.startTime),
    formatClock(row.endTime),
    displayStatus(row),
    row.reason ?? "",
  ]
    .join(" ")
    .toLowerCase();
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
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function clockStamp(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}:${String(date.getSeconds()).padStart(2, "0")}`;
}

function historyRows(rows: HallBooking[]): string[][] {
  return rows.map((row) => [
    `#${row.id.slice(0, 8)}`,
    row.employeeName || "System",
    row.hallName,
    row.bookingDate,
    `${formatClock(row.startTime)} - ${formatClock(row.endTime)}`,
    displayStatus(row),
    row.reason ?? "",
  ]);
}

async function exportHistoryExcel(rows: HallBooking[]) {
  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js");
  const xlsx = (window as unknown as { XLSX: XlsxApi }).XLSX;
  const sheet = xlsx.utils.aoa_to_sheet([
    ["Ref ID", "Requestor", "Hall", "Date", "Timing", "Status", "Reason"],
    ...historyRows(rows),
  ]);
  const book = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(book, sheet, "History");
  xlsx.writeFile(book, "Booking History.xlsx");
}

async function exportHistoryPdf(rows: HallBooking[]) {
  const { default: html2pdf } = await import("html2pdf.js");
  const table = document.createElement("table");
  table.innerHTML = `<thead><tr><th>Ref ID</th><th>Requestor</th><th>Hall</th><th>Date</th><th>Timing</th><th>Status</th><th>Reason</th></tr></thead><tbody>${historyRows(rows)
    .map((cells) => `<tr>${cells.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`)
    .join("")}</tbody>`;
  table.style.position = "fixed";
  table.style.left = "-10000px";
  table.style.background = "#fff";
  document.body.appendChild(table);

  try {
    await html2pdf()
      .set({
        margin: 0.4,
        filename: "Booking History.pdf",
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
    .replace(/>/g, "&gt;");
}

type XlsxApi = {
  utils: {
    aoa_to_sheet: (rows: string[][]) => unknown;
    book_new: () => unknown;
    book_append_sheet: (book: unknown, sheet: unknown, name: string) => void;
  };
  writeFile: (book: unknown, name: string) => void;
};

function loadScript(src: string): Promise<void> {
  if (document.querySelector(`script[src="${src}"]`)) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Unable to export the booking history."));
    document.body.appendChild(script);
  });
}
