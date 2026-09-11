"use client";

import { FileText, Plus, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { GuaranteeForm } from "@/components/procurement/guarantee-form";
import { ReleaseGuaranteeModal } from "@/components/procurement/release-guarantee-modal";
import { Button, Select, Spinner } from "@/components/ui";
import { useCalendarSystem } from "@/lib/calendar-system";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/currency";
import { openAuthenticatedMedia } from "@/lib/media";
import {
  formatCalendarDate,
  type CalendarSystem,
} from "@/lib/nepali-date";
import { getGuarantees } from "@/lib/procurement";
import type {
  Guarantee,
  GuaranteeListResponse,
  GuaranteeStatus,
  GuaranteeType,
} from "@/types/procurement";

const EMPTY_SUMMARY: GuaranteeListResponse["summary"] = {
  activeCount: 0,
  activeAmount: "0.00",
  expiringSoonCount: 0,
  releasedCount: 0,
};

export default function GuaranteeLedgerPage() {
  const { system } = useCalendarSystem();

  const [items, setItems] = useState<Guarantee[]>([]);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [releasing, setReleasing] = useState<Guarantee | null>(null);
  const [typeFilter, setTypeFilter] = useState<GuaranteeType | "">("");
  const [statusFilter, setStatusFilter] = useState<GuaranteeStatus | "">("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getGuarantees({
        guaranteeType: typeFilter || undefined,
        status: statusFilter || undefined,
      });

      setItems(result.items);
      setSummary(result.summary);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load guarantees.",
      );
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            BG | PG Guarantee
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Monitor bank and performance guarantees, their release horizons and
            supporting documents.
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void load()} loading={loading}>
            <RefreshCw size={16} /> Refresh
          </Button>

          <Button onClick={() => setFormOpen((current) => !current)}>
            <Plus size={17} /> Register New Guarantee
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCube label="Active Guarantees" value={summary.activeCount} />
        <SummaryCube
          label="Committed Value"
          value={formatCurrency(summary.activeAmount, {
            minimumFractionDigits: 0,
          })}
        />
        <SummaryCube
          label="Expiring in 30 Days"
          value={summary.expiringSoonCount}
          tone={summary.expiringSoonCount > 0 ? "warning" : "default"}
        />
        <SummaryCube label="Released" value={summary.releasedCount} />
      </div>

      {formOpen ? (
        <GuaranteeForm
          onCancel={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false);
            void load();
          }}
        />
      ) : null}

      <section className="overflow-hidden rounded-2xl bg-white shadow-[0_18px_48px_rgba(15,23,42,.1)]">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold text-slate-900">Guarantee Ledger</h2>

          <div className="flex gap-2">
            <Select
              aria-label="Guarantee Type"
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(event.target.value as GuaranteeType | "")
              }
              className="py-2"
              wrapperClassName="w-44"
            >
              <option value="">All Types</option>
              <option value="BG">BG - Bank Guarantee</option>
              <option value="PG">PG - Performance Guarantee</option>
            </Select>

            <Select
              aria-label="Guarantee Status"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as GuaranteeStatus | "")
              }
              className="py-2"
              wrapperClassName="w-40"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="RELEASED">Released</option>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : items.length === 0 ? (
          <p className="py-16 text-center text-sm text-slate-500">
            No guarantees recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 text-left font-bold">S/N</th>
                  <th className="px-4 py-2.5 text-left font-bold">Class</th>
                  <th className="px-4 py-2.5 text-left font-bold">
                    Client &amp; Tender Scope
                  </th>
                  <th className="px-4 py-2.5 text-left font-bold">Bank Name</th>
                  <th className="px-4 py-2.5 text-right font-bold">
                    Amount (Rs.)
                  </th>
                  <th className="px-4 py-2.5 text-left font-bold">
                    Expiry Date
                  </th>
                  <th className="px-4 py-2.5 text-left font-bold">
                    Assigned Personnel
                  </th>
                  <th className="px-4 py-2.5 text-left font-bold">Proof</th>
                  <th className="px-4 py-2.5 text-right font-bold">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {items.map((guarantee, index) => (
                  <GuaranteeRow
                    key={guarantee.id}
                    index={index}
                    guarantee={guarantee}
                    system={system}
                    onRelease={() => setReleasing(guarantee)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <ReleaseGuaranteeModal
        guarantee={releasing}
        onClose={() => setReleasing(null)}
        onReleased={() => void load()}
      />
    </div>
  );
}

function GuaranteeRow({
  index,
  guarantee,
  system,
  onRelease,
}: {
  index: number;
  guarantee: Guarantee;
  system: CalendarSystem;
  onRelease: () => void;
}) {
  return (
    <tr className="text-slate-700">
      <td className="px-4 py-3 text-slate-400">{index + 1}</td>

      <td className="px-4 py-3">
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[11px] font-semibold",
            guarantee.guaranteeType === "BG"
              ? "bg-indigo-100 text-indigo-700"
              : "bg-purple-100 text-purple-700",
          )}
        >
          {guarantee.guaranteeType}
        </span>
      </td>

      <td className="px-4 py-3">
        <p className="font-semibold text-slate-900">{guarantee.clientName}</p>
        <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
          {guarantee.tenderDetails}
        </p>
      </td>

      <td className="px-4 py-3">{guarantee.bankNameBranch}</td>

      <td className="px-4 py-3 text-right font-semibold text-slate-900">
        {formatCurrency(guarantee.amount)}
      </td>

      <td className="px-4 py-3">
        <p>{formatCalendarDate(guarantee.expiryDate, system)}</p>

        {guarantee.expired ? (
          <span className="mt-0.5 inline-block rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
            Expired
          </span>
        ) : guarantee.expiringSoon ? (
          <span className="mt-0.5 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
            Expiring Soon
          </span>
        ) : null}
      </td>

      <td className="px-4 py-3">{guarantee.assignedPerson ?? "—"}</td>

      <td className="px-4 py-3">
        {guarantee.documentUrl ? (
          <button
            type="button"
            onClick={() => void openAuthenticatedMedia(guarantee.documentUrl)}
            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
          >
            <FileText size={14} /> View
          </button>
        ) : (
          <span className="text-slate-400">—</span>
        )}
      </td>

      <td className="px-4 py-3 text-right">
        {guarantee.status === "ACTIVE" ? (
          <Button size="sm" variant="outline" onClick={onRelease}>
            Release
          </Button>
        ) : (
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
            Released
          </span>
        )}
      </td>
    </tr>
  );
}

function SummaryCube({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string | number;
  tone?: "default" | "warning";
}) {
  return (
    <div className="rounded-xl bg-white px-4 py-3 shadow-[0_12px_32px_rgba(15,23,42,.08)]">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p
        className={cn(
          "mt-1 text-lg font-extrabold leading-tight",
          tone === "warning" ? "text-amber-600" : "text-slate-900",
        )}
      >
        {value}
      </p>
    </div>
  );
}
