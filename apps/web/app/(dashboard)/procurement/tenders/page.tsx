"use client";

import { CalendarPlus, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { ScheduleTenderModal } from "@/components/procurement/schedule-tender-modal";
import { TenderCalendar } from "@/components/procurement/tender-calendar";
import { Button, Spinner } from "@/components/ui";
import { toIsoDate } from "@/lib/nepali-date";
import { getTenders } from "@/lib/procurement";
import type { Tender } from "@/types/procurement";

export default function TenderManagementPage() {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => toIsoDate(new Date()));
  const [selectedTender, setSelectedTender] = useState<Tender | null>(null);

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

  function openForDate(isoDate: string): void {
    setSelectedTender(null);
    setSelectedDate(isoDate);
    setModalOpen(true);
  }

  function openForTender(tender: Tender): void {
    setSelectedTender(tender);
    setSelectedDate(tender.submissionDate);
    setModalOpen(true);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Tender Management
          </h1>
          <p className="mt-0.5 text-sm text-slate-600">
            Track procurement deadlines and submission status.
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void load()} loading={loading}>
            <RefreshCw size={16} /> Refresh
          </Button>

          <Button onClick={() => openForDate(toIsoDate(new Date()))}>
            <CalendarPlus size={17} /> Schedule Tender
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="rounded-2xl bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,.1)]">
        <div className="mb-3 flex flex-wrap items-baseline gap-x-3">
          <h2 className="text-base font-bold text-slate-900">
            Tender Schedule
          </h2>
          <p className="text-xs text-slate-500">
            Pick a day to schedule a tender, or open an existing one to edit it.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : (
          <TenderCalendar
            tenders={tenders}
            onSelectDate={openForDate}
            onSelectTender={openForTender}
          />
        )}
      </section>

      <ScheduleTenderModal
        open={modalOpen}
        defaultDate={selectedDate}
        tender={selectedTender}
        onClose={() => setModalOpen(false)}
        onSaved={() => void load()}
      />
    </div>
  );
}
