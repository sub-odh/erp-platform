"use client";

import { CalendarCheck, CalendarDays, List } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  HolidayCalendar,
  holidaysInMonth,
} from "@/components/holidays/holiday-calendar";
import { Spinner } from "@/components/ui";
import { useCalendarSystem } from "@/lib/calendar-system";
import { getHolidays } from "@/lib/holidays";
import { formatCalendarDate } from "@/lib/nepali-date";
import type { Holiday } from "@/types/holiday";

type DirectoryView = "calendar" | "list";

export default function CompanyCalendarPage() {
  const { system } = useCalendarSystem();
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [anchor, setAnchor] = useState(() => new Date());
  const [view, setView] = useState<DirectoryView>("calendar");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setHolidays(await getHolidays());
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load the company calendar.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const monthHolidays = useMemo(
    () => holidaysInMonth(holidays, anchor, system),
    [anchor, holidays, system],
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <CalendarCheck size={20} />
          </div>
          <div>
            <p className="text-sm font-medium text-blue-600">HR & Operations</p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Company Calendar
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Read-only holiday calendar for the company.
            </p>
          </div>
        </div>

        <div className="flex rounded-lg bg-slate-100 p-0.5">
          <ViewTab
            active={view === "calendar"}
            label="Interactive Calendar"
            icon={CalendarDays}
            onClick={() => setView("calendar")}
          />
          <ViewTab
            active={view === "list"}
            label="Summary List"
            icon={List}
            onClick={() => setView("list")}
          />
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading && holidays.length === 0 ? (
        <div className="flex min-h-72 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <Spinner />
        </div>
      ) : view === "list" ? (
        <HolidaySummaryTable holidays={holidays} />
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <HolidayCalendar holidays={holidays} onMonthChange={setAnchor} />
          <MonthHolidayList holidays={monthHolidays} />
        </div>
      )}
    </div>
  );
}

function ViewTab({
  active,
  label,
  icon: Icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: typeof CalendarDays;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition",
        active
          ? "bg-white text-blue-600 shadow-sm"
          : "text-slate-500 hover:text-slate-700",
      ].join(" ")}
    >
      <Icon size={15} />
      {label}
    </button>
  );
}

function HolidaySummaryTable({ holidays }: { holidays: Holiday[] }) {
  const { system } = useCalendarSystem();

  if (holidays.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center text-sm text-slate-500">
        No holidays listed.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Holiday Title
            </th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Date
            </th>
            <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Description
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {holidays.map((holiday) => (
            <tr key={holiday.id}>
              <td className="px-5 py-3 font-semibold text-slate-900">
                {holiday.title}
              </td>
              <td className="px-4 py-3">
                <span className="rounded-md border border-red-100 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">
                  {formatCalendarDate(holiday.holidayDate, system)}
                </span>
              </td>
              <td className="px-5 py-3 text-sm text-slate-500">
                {holiday.description || "Full day office closure"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MonthHolidayList({ holidays }: { holidays: Holiday[] }) {
  const { system } = useCalendarSystem();

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <CalendarDays size={16} className="text-red-500" />
          Holidays
        </h2>
      </div>
      <div className="max-h-[40rem] overflow-y-auto">
        {holidays.length === 0 ? (
          <p className="px-4 py-16 text-center text-sm text-slate-500">
            No holidays for this month.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {holidays.map((holiday) => {
              const date = new Date(`${holiday.holidayDate}T00:00:00`);

              return (
                <li key={holiday.id} className="flex items-start gap-3 px-4 py-3">
                  <div className="flex h-14 w-12 shrink-0 flex-col items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-600">
                    <span className="text-[10px] font-bold uppercase">
                      {date.toLocaleDateString(undefined, { weekday: "short" })}
                    </span>
                    <span className="text-lg font-extrabold leading-none">
                      {date.getDate()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{holiday.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {holiday.description || "Full day office closure"}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      {formatCalendarDate(holiday.holidayDate, system)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
