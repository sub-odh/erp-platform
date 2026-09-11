"use client";

import { Eye, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  TenderCalendar,
  URGENCY_STYLES,
} from "@/components/procurement/tender-calendar";
import { Button, Spinner } from "@/components/ui";
import { useCalendarSystem } from "@/lib/calendar-system";
import { cn } from "@/lib/cn";
import {
  formatCalendarDate,
  type CalendarSystem,
} from "@/lib/nepali-date";
import { getTenders } from "@/lib/procurement";
import type { Tender } from "@/types/procurement";

export default function TenderCalendarPage() {
  const { system } = useCalendarSystem();

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

  /* The deadline panel only cares about work that is still ahead. */
  const upcoming = useMemo(
    () => tenders.filter((tender) => tender.urgency !== "OVERDUE").slice(0, 12),
    [tenders],
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Tender Calendar</h1>
          <p className="mt-0.5 text-sm text-slate-600">
            Live tracking of project deadlines and submission statuses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
            <Eye size={14} /> Read-Only View
          </span>

          <Button variant="outline" onClick={() => void load()} loading={loading}>
            <RefreshCw size={16} /> Refresh
          </Button>
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
              No upcoming tender deadlines.
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
                  <UpcomingRow
                    key={tender.id}
                    tender={tender}
                    system={system}
                  />
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}

function UpcomingRow({
  tender,
  system,
}: {
  tender: Tender;
  system: CalendarSystem;
}) {
  return (
    <tr>
      <td className="py-2.5 pr-3">
        <p className="font-semibold text-slate-900">{tender.title}</p>
        <p className="mt-0.5 text-xs text-slate-500">
          {formatCalendarDate(tender.submissionDate, system)}
        </p>
      </td>

      <td className="py-2.5 text-right">
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[11px] font-semibold",
            URGENCY_STYLES[tender.urgency].badge,
          )}
        >
          {URGENCY_STYLES[tender.urgency].label}
        </span>
      </td>
    </tr>
  );
}
