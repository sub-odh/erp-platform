"use client";

import { CalendarDays } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  HolidayCalendar,
  holidaysInMonth,
} from "@/components/holidays/holiday-calendar";
import { HolidayFormModal } from "@/components/holidays/holiday-form-modal";
import { ConfirmDialog, Spinner } from "@/components/ui";
import { useCalendarSystem } from "@/lib/calendar-system";
import { toIsoDate } from "@/lib/nepali-date";
import {
  createHoliday,
  deleteHoliday,
  getHolidays,
  updateHoliday,
} from "@/lib/holidays";
import type { Holiday, HolidayInput } from "@/types/holiday";

export default function HolidayManagementPage() {
  const { system } = useCalendarSystem();
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formDate, setFormDate] = useState(toIsoDate(new Date()));
  const [selected, setSelected] = useState<Holiday | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setHolidays(await getHolidays());
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load holidays.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(() => {
    const today = toIsoDate(new Date());

    return {
      total: holidays.length,
      upcoming: holidays.filter((holiday) => holiday.holidayDate >= today)
        .length,
      thisMonth: holidaysInMonth(holidays, new Date(), system).length,
    };
  }, [holidays, system]);

  function openCreate(isoDate: string, holiday?: Holiday) {
    if (holiday) {
      setSelected(holiday);
      setFormDate(holiday.holidayDate);
    } else {
      setSelected(null);
      setFormDate(isoDate);
    }
    setFormOpen(true);
  }

  async function handleSubmit(payload: HolidayInput) {
    setSubmitting(true);
    setError(null);

    try {
      if (selected) {
        await updateHoliday(selected.id, payload);
      } else {
        await createHoliday(payload);
      }
      setFormOpen(false);
      setSelected(null);
      await load();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save this holiday.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!selected) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await deleteHoliday(selected.id);
      setDeleteOpen(false);
      setFormOpen(false);
      setSelected(null);
      await load();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete this holiday.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <CalendarDays size={20} />
          </div>
          <div>
            <p className="text-sm font-medium text-blue-600">HR & Operations</p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Holiday Management
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Click any date to mark a holiday.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
            Holiday
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-900" />
            Today
          </span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatChip label="Total Holidays" value={stats.total} />
        <StatChip label="Upcoming" value={stats.upcoming} />
        <StatChip label="This Month" value={stats.thisMonth} />
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
      ) : (
        <HolidayCalendar
          holidays={holidays}
          onSelectDate={openCreate}
          onSelectHoliday={(holiday) => openCreate(holiday.holidayDate, holiday)}
        />
      )}

      <HolidayFormModal
        open={formOpen}
        holiday={selected}
        holidayDate={formDate}
        submitting={submitting}
        onClose={() => {
          setFormOpen(false);
          setSelected(null);
        }}
        onSubmit={handleSubmit}
        onDelete={() => setDeleteOpen(true)}
      />

      <ConfirmDialog
        open={deleteOpen}
        title="Delete Holiday"
        description="This date will no longer be marked as a company holiday."
        confirmLabel="Delete Holiday"
        destructive
        loading={submitting}
        onConfirm={() => void handleDelete()}
        onClose={() => setDeleteOpen(false)}
      />
    </div>
  );
}

function StatChip({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div>
        <p className="text-lg font-bold text-slate-900">{value}</p>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </p>
      </div>
    </div>
  );
}
