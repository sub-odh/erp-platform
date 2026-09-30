"use client";

import { Eye, Pencil, Printer, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { QuotationPurgeView } from "@/components/quotations/quotation-purge-view";
import { Button, Input, Modal, Select, Spinner } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { formatCurrency } from "@/lib/currency";
import { formatPiAmount } from "@/lib/pi-format";
import { getQuotation, getQuotations, purgeQuotation } from "@/lib/quotations";
import type { QuotationDetails, QuotationListItem, QuotationMetrics } from "@/types/quotations";

const FLASH: Record<string, string> = {
  creation_success:
    "Quotation record generated and synchronized successfully down to the ledger.",
  update_success:
    "Quotation baseline definitions and ledger metrics revised cleanly.",
  delete_success:
    "Target proposal entry and related child arrays dropped permanently from records.",
};

const SORTS = [
  ["quotation_number", "Tracking ID"],
  ["quotation_date", "Issue Date"],
  ["expiry_date", "Expiry Date"],
  ["customer_name", "Client"],
  ["total_amount", "Grand Total"],
  ["lead", "Mapped Lead"],
] as const;

export default function QuotationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const flash = FLASH[searchParams.get("msg") ?? ""] ?? null;
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | "active" | "expired">("");
  const [sort, setSort] = useState("quotation_date");
  const [direction, setDirection] = useState<"asc" | "desc">("desc");
  const [items, setItems] = useState<QuotationListItem[]>([]);
  const [metrics, setMetrics] = useState<QuotationMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<QuotationDetails | null>(null);
  const [purge, setPurge] = useState<QuotationListItem | null>(null);
  const [purgeError, setPurgeError] = useState<string | null>(null);
  const [purging, setPurging] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getQuotations({
        search: search.trim() || undefined,
        status: status || undefined,
        sort,
        direction,
      });
      setItems(result.items);
      setMetrics(result.metrics);
    } catch (reason: unknown) {
      setError(reason instanceof ApiError ? reason.message : "Quotations could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [direction, search, sort, status]);

  useEffect(() => {
    void load();
  }, [load]);

  function toggleSort(column: string) {
    if (sort === column) {
      setDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSort(column);
    setDirection("asc");
  }

  async function openView(id: string) {
    const details = await getQuotation(id);
    setView(details);
  }

  async function confirmPurge(password: string) {
    if (!purge) return;
    setPurging(true);
    setPurgeError(null);
    try {
      await purgeQuotation(purge.id, password);
      setPurge(null);
      router.push("/quotations?msg=delete_success");
      await load();
    } catch (reason: unknown) {
      setPurgeError(
        reason instanceof ApiError
          ? reason.message
          : "Administrative clearance failure: Security code authorization mismatch.",
      );
    } finally {
      setPurging(false);
    }
  }

  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kathmandu",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-900">Commercial Quotation Pipeline</h1>
        <Link href="/quotations/new">
          <Button>Generate New Quotation</Button>
        </Link>
      </div>
      {flash ? <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{flash}</p> : null}
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Total Proposals Filed" value={String(metrics?.totalCount ?? 0)} />
        <Metric
          label="Gross Pipeline Valuation (Inc. VAT)"
          value={formatCurrency(Number(metrics?.pipelineGrossValue ?? 0))}
        />
        <Metric label="Expired" value={String(metrics?.expiredCount ?? 0)} />
      </div>
      <div className="flex flex-wrap gap-2">
        <div className="min-w-64">
          <Input
            placeholder="Search number, customer, or lead"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <Select value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
        </Select>
      </div>
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-500">
          No commercial pipeline tracking quotations found matching the requested query filter boundaries.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                {SORTS.map(([key, label]) => (
                  <th key={key} className="px-3 py-2">
                    <button type="button" onClick={() => toggleSort(key)}>
                      {label}
                      {sort === key ? (direction === "asc" ? " ↑" : " ↓") : ""}
                    </button>
                  </th>
                ))}
                <th className="px-3 py-2">State</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => {
                const expired = Boolean(row.expiryDate && row.expiryDate < today);
                return (
                  <tr
                    key={row.id}
                    className="cursor-pointer border-t border-slate-100 hover:bg-slate-50"
                    onClick={() => void openView(row.id)}
                  >
                    <td className="px-3 py-2 font-mono">{row.quotationNumber}</td>
                    <td className="px-3 py-2">{row.quotationDate}</td>
                    <td className={`px-3 py-2 ${expired ? "font-bold text-rose-700" : ""}`}>
                      {row.expiryDate || "N/A"}
                    </td>
                    <td className="px-3 py-2">
                      <div>{row.customerName || "N/A"}</div>
                      <div className="text-xs text-slate-500">by: {row.creatorName}</div>
                    </td>
                    <td className="px-3 py-2">
                      {row.leadName ? (
                        <Link href="/leads" className="rounded bg-slate-100 px-2 py-0.5 text-xs" onClick={(event) => event.stopPropagation()}>
                          {row.leadName}
                        </Link>
                      ) : (
                        "Unmapped"
                      )}
                    </td>
                    <td className="px-3 py-2">{formatPiAmount(row.totalAmount, row.currency)}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${expired ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"}`}>
                        {expired ? "Expired" : "Active"}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1" onClick={(event) => event.stopPropagation()}>
                        <Link href={`/quotations/${row.id}/print`} target="_blank" className="rounded p-1 text-slate-600 hover:bg-slate-100" title="Print">
                          <Printer className="size-4" />
                        </Link>
                        <Link href={`/quotations/${row.id}/edit`} className="rounded p-1 text-slate-600 hover:bg-slate-100" title="Edit">
                          <Pencil className="size-4" />
                        </Link>
                        <button
                          type="button"
                          className="rounded p-1 text-rose-600 hover:bg-rose-50"
                          title="Purge"
                          onClick={() => {
                            setPurgeError(null);
                            setPurge(row);
                          }}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <Modal
        open={Boolean(view)}
        title={`Quotation Proposal View: ${view?.quotationNumber ?? ""}`}
        onClose={() => setView(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setView(null)}>
              Dismiss View
            </Button>
            {view ? (
              <Link href={`/quotations/${view.id}/print`} target="_blank">
                <Button>
                  <Eye className="size-4" />
                  Print / Save Proposal PDF
                </Button>
              </Link>
            ) : null}
          </>
        }
      >
        {view ? (
          <div className="space-y-3 text-sm">
            <p><strong>Client:</strong> {view.customerName}</p>
            <p className="whitespace-pre-line"><strong>Address:</strong> {view.customerAddress || "N/A"}</p>
            <p><strong>Mapped Lead:</strong> {view.leadName || "Unmapped"}</p>
            <p><strong>Issue:</strong> {view.quotationDate}</p>
            <p><strong>Expiry:</strong> {view.expiryDate || "On Notice"}</p>
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs uppercase text-slate-500">
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Rate</th>
                </tr>
              </thead>
              <tbody>
                {view.items.map((item, index) => (
                  <tr key={item.id ?? index}>
                    <td>{item.itemName}</td>
                    <td>{item.quantity}</td>
                    <td>{formatPiAmount(item.unitPrice, view.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="font-semibold">
              Gross Amount {view.vatApplicable ? "(Inc. 13% VAT)" : ""}: {formatPiAmount(view.totalAmount, view.currency)}
            </p>
            <p className="whitespace-pre-line">{view.termsConditions}</p>
            <p>Created by {view.creatorName}</p>
          </div>
        ) : null}
      </Modal>
      <QuotationPurgeView
        open={Boolean(purge)}
        trackingId={purge?.quotationNumber ?? ""}
        loading={purging}
        error={purgeError ?? undefined}
        onClose={() => setPurge(null)}
        onConfirm={(password) => void confirmPurge(password)}
      />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}
