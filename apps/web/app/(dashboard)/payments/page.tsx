"use client";

import { CircleDollarSign, RefreshCw, Search } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button, Select, Spinner } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { formatCurrency } from "@/lib/currency";
import {
  getInvoiceSummary,
  getInvoices,
  recordInvoicePayment,
} from "@/lib/invoices";
import type {
  InvoiceListItem,
  InvoiceStatus,
  InvoiceSummary,
  PaymentMethod,
} from "@/types/invoices";

const money = (value: string | number) => formatCurrency(value);

export default function PaymentsPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | InvoiceStatus>("");
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [summary, setSummary] = useState<InvoiceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collecting, setCollecting] = useState<InvoiceListItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [rows, totals] = await Promise.all([
        getInvoices({
          search: search || undefined,
          status: status || undefined,
        }),
        getInvoiceSummary(),
      ]);
      setInvoices(rows);
      setSummary(totals);
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Unable to load recovery records.",
      );
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    void load();
  }, [load]);

  const outstanding = Number(summary?.outstanding ?? 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Payments & Recovery
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Outstanding:{" "}
            <span className="text-lg font-bold text-rose-600">
              {money(outstanding)}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="relative">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") setSearch(searchInput.trim());
              }}
              placeholder="Search..."
              className="h-10 w-48 rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 text-sm outline-none focus:border-indigo-500"
            />
          </label>
          <Button variant="outline" onClick={() => void load()} loading={loading}>
            <RefreshCw size={16} /> Refresh
          </Button>
        </div>
      </div>

      <section className="grid gap-3 md:grid-cols-3">
        <StatChip
          label="Pending Recovery"
          value={summary?.unpaid ?? 0}
          active={status === "UNPAID"}
          tone="rose"
          onClick={() => setStatus(status === "UNPAID" ? "" : "UNPAID")}
        />
        <StatChip
          label="Partial Recovery"
          value={summary?.partial ?? 0}
          active={status === "PARTIAL"}
          tone="amber"
          onClick={() => setStatus(status === "PARTIAL" ? "" : "PARTIAL")}
        />
        <StatChip
          label="Full Recovery"
          value={summary?.paid ?? 0}
          active={status === "PAID"}
          tone="emerald"
          onClick={() => setStatus(status === "PAID" ? "" : "PAID")}
        />
      </section>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-3 text-sm font-semibold">
          {invoices.length} Records
        </div>
        {loading ? (
          <div className="flex min-h-60 items-center justify-center">
            <Spinner />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-[11px] uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3">Invoice</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">DO Number</th>
                  <th className="px-5 py-3">Aging</th>
                  <th className="px-5 py-3 text-right">Balance Due</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="h-32 text-center text-slate-400">
                      No billed delivery orders yet.
                    </td>
                  </tr>
                ) : (
                  invoices.map((invoice) => {
                    const balance =
                      Number(invoice.totalAmount) - Number(invoice.paidAmount);
                    const aging = agingDays(invoice.invoiceDate);
                    return (
                      <tr
                        key={invoice.id}
                        className={`border-b border-slate-50 ${
                          invoice.status === "PAID"
                            ? "bg-emerald-50/60"
                            : aging > 35 && invoice.status !== "VOID"
                              ? "bg-rose-50/70"
                              : ""
                        }`}
                      >
                        <td className="px-5 py-3 font-mono text-xs font-bold text-blue-600">
                          {invoice.invoiceNumber}
                        </td>
                        <td className="px-5 py-3 text-slate-500">
                          {formatDate(invoice.invoiceDate)}
                        </td>
                        <td className="px-5 py-3 font-semibold">
                          {invoice.customerName}
                        </td>
                        <td className="px-5 py-3 font-mono text-xs">
                          {invoice.deliveryNumber}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={
                              aging > 35
                                ? "font-bold text-rose-600"
                                : "text-slate-400"
                            }
                          >
                            {aging} days
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right font-bold">
                          {money(Math.max(0, balance))}
                        </td>
                        <td className="px-5 py-3">
                          <StatusBadge status={invoice.status} />
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex flex-wrap gap-2">
                            {invoice.status !== "PAID" &&
                            invoice.status !== "VOID" ? (
                              <button
                                type="button"
                                onClick={() => setCollecting(invoice)}
                                className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-bold text-white"
                              >
                                Collect
                              </button>
                            ) : null}
                            <Link
                              href={`/invoices/${invoice.id}`}
                              className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-bold text-blue-700"
                            >
                              Statement
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {collecting ? (
        <CollectModal
          invoice={collecting}
          onClose={() => setCollecting(null)}
          onSaved={async () => {
            setCollecting(null);
            await load();
          }}
          onError={setError}
        />
      ) : null}
    </div>
  );
}

function CollectModal({
  invoice,
  onClose,
  onSaved,
  onError,
}: {
  invoice: InvoiceListItem;
  onClose: () => void;
  onSaved: () => Promise<void>;
  onError: (message: string) => void;
}) {
  const balance = Math.max(
    0,
    Number(invoice.totalAmount) - Number(invoice.paidAmount),
  );
  const [amount, setAmount] = useState(String(balance.toFixed(2)));
  const [method, setMethod] = useState<PaymentMethod>("BANK");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);

  const remainingLabel = useMemo(() => money(balance), [balance]);

  async function submit(): Promise<void> {
    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      onError("Enter a valid payment amount.");
      return;
    }
    setSaving(true);
    try {
      await recordInvoicePayment(invoice.id, {
        amount: parsed,
        method,
        referenceNumber: referenceNumber.trim() || undefined,
        remarks: remarks.trim() || undefined,
      });
      await onSaved();
    } catch (cause) {
      onError(
        cause instanceof ApiError
          ? cause.message
          : "Unable to record this payment.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center gap-2">
          <CircleDollarSign size={18} className="text-emerald-600" />
          <h2 className="font-bold">Collect Payment</h2>
        </div>
        <p className="mb-4 text-sm text-slate-600">
          {invoice.invoiceNumber} · Balance {remainingLabel}
        </p>
        <div className="space-y-3">
          <label className="block text-sm">
            Amount
            <input
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3"
            />
          </label>
          <Select
            label="Method"
            value={method}
            onChange={(event) =>
              setMethod(event.target.value as PaymentMethod)
            }
            className="h-10 py-2"
          >
            <option value="CASH">Cash</option>
            <option value="BANK">Bank Transfer</option>
            <option value="CHEQUE">Cheque</option>
            <option value="ONLINE">Online</option>
            <option value="OTHER">Other</option>
          </Select>
          <label className="block text-sm">
            Reference
            <input
              value={referenceNumber}
              onChange={(event) => setReferenceNumber(event.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3"
            />
          </label>
          <label className="block text-sm">
            Remarks
            <textarea
              value={remarks}
              onChange={(event) => setRemarks(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              rows={2}
            />
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => void submit()} loading={saving}>
            Save Payment
          </Button>
        </div>
      </div>
    </div>
  );
}

function StatChip({
  label,
  value,
  active,
  tone,
  onClick,
}: {
  label: string;
  value: number;
  active: boolean;
  tone: "rose" | "amber" | "emerald";
  onClick: () => void;
}) {
  const tones = {
    rose: "bg-rose-50 text-rose-600",
    amber: "bg-amber-50 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-600",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 rounded-2xl border bg-white p-4 text-left shadow-sm ${
        active ? "border-indigo-400 bg-indigo-50" : "border-slate-200"
      }`}
    >
      <span
        className={`flex h-11 w-11 items-center justify-center rounded-xl ${tones[tone]}`}
      >
        <CircleDollarSign size={18} />
      </span>
      <span>
        <span className="block text-2xl font-extrabold text-slate-900">
          {value}
        </span>
        <span className="text-[11px] font-bold tracking-wide text-slate-400">
          {label}
        </span>
      </span>
    </button>
  );
}

function StatusBadge({ status }: { status: InvoiceStatus }) {
  const map: Record<InvoiceStatus, [string, string]> = {
    UNPAID: ["Pending", "bg-rose-50 text-rose-700"],
    PARTIAL: ["Partial", "bg-amber-50 text-amber-700"],
    PAID: ["Paid", "bg-emerald-50 text-emerald-700"],
    VOID: ["Voided", "bg-slate-100 text-slate-500"],
  };
  const [label, className] = map[status];
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${className}`}>
      {label}
    </span>
  );
}

function agingDays(invoiceDate: string): number {
  const start = new Date(`${invoiceDate}T00:00:00`);
  return Math.max(
    0,
    Math.floor((Date.now() - start.getTime()) / (1000 * 60 * 60 * 24)),
  );
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
