"use client";

import { Eye } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { TenderCalendar } from "@/components/procurement/tender-calendar";
import { Spinner } from "@/components/ui";
import { formatCalendarDate } from "@/lib/nepali-date";
import { getTenders } from "@/lib/procurement";
import type { Tender } from "@/types/procurement";

export default function TenderCalendarPage() {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setTenders(await getTenders());
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load tenders.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const upcoming = useMemo(() => {
    const now = Date.now();
    return [...tenders]
      .sort((left, right) => left.submissionDate.localeCompare(right.submissionDate))
      .filter((tender) => noon(tender.submissionDate) >= now - 2 * 86400000);
  }, [tenders]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Tender Schedule</h1>
          <p className="mt-0.5 text-sm text-slate-600">
            Live tracking of project deadlines and submission statuses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
            <Eye size={14} /> Read-Only View
          </span>

        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-3 xl:grid-cols-3">
        <section className="rounded-2xl bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,.1)] xl:col-span-2">
          <div className="mb-3 flex flex-wrap items-baseline gap-x-3">
            <h2 className="text-base font-bold text-slate-900">
              Tender Schedule
            </h2>
            <p className="text-xs text-slate-500">
              Deadlines are colour coded by how close they are.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner />
            </div>
          ) : (
            <TenderCalendar tenders={tenders} />
          )}
        </section>

        <section className="rounded-2xl bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,.1)]">
          <h2 className="text-base font-bold text-slate-900">
            Upcoming Deadlines
          </h2>

          {loading ? (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          ) : upcoming.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">
              No active tenders.
            </p>
          ) : (
            <table className="mt-3 w-full text-sm">
              <thead className="text-[10px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="pb-2 text-left font-bold">
                    Project / Deadline
                  </th>
                  <th className="pb-2 text-right font-bold">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {upcoming.map((tender) => (
                  <UpcomingRow key={tender.id} tender={tender} />
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}

function noon(isoDate: string): number {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1, 12, 0, 0, 0).getTime();
}

function UpcomingRow({ tender }: { tender: Tender }) {
  const deadline = noon(tender.submissionDate);
  const now = new Date();
  const closed = deadline < now.getTime();
  const sameDay =
    new Date(deadline).toDateString() === now.toDateString();
  const diff = deadline - now.getTime();
  const daysLeft = Math.floor(diff / 86400000);
  const hoursLeft = Math.floor(diff / 3600000);
  const urgent = diff < 432000000 && !closed;
  const ad = new Date(deadline).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <tr>
      <td className="py-2.5 pr-3">
        <p className="max-w-[180px] truncate font-semibold text-slate-900" title={tender.title}>
          {tender.title}
        </p>
        <p className="mt-0.5 text-[11px] text-slate-500">{ad}</p>
        <p className="text-[11px] font-semibold text-violet-600">
          {formatCalendarDate(tender.submissionDate, "BS")}
        </p>
      </td>
      <td className="py-2.5 text-right">
        {closed ? (
          <span className="rounded-full border bg-slate-50 px-2 py-0.5 text-[11px] text-slate-500">
            Closed
          </span>
        ) : sameDay ? (
          <span className="animate-pulse rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-semibold text-white">
            {hoursLeft} Hours Left
          </span>
        ) : urgent ? (
          <span className="animate-pulse rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-semibold text-white">
            {daysLeft} Days Left
          </span>
        ) : (
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
            {daysLeft} Days Left
          </span>
        )}
      </td>
    </tr>
  );
}
