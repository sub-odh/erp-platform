"use client";

import { Eye, FileText, Plus, RefreshCw, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Button, Select, Spinner } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { getInvoices } from "@/lib/invoices";
import type { InvoiceListItem, InvoiceStatus } from "@/types/invoices";

const money = (value: string | number) =>
  `Rs. ${Number(value).toLocaleString("en-NP", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  UNPAID: "Pending",
  PARTIAL: "Partial",
  PAID: "Paid",
  VOID: "Voided",
};

export default function InvoicesPage() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | InvoiceStatus>("");
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setInvoices(
        await getInvoices({
          search: search || undefined,
          status: status || undefined,
        }),
      );
    } catch (cause) {
      setError(
        cause instanceof ApiError ? cause.message : "Unable to load invoices.",
      );
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Invoices</h1>
          <p className="mt-1 text-sm text-slate-600">
            Tax invoices generated from confirmed delivery orders.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void load()} loading={loading}>
            <RefreshCw size={16} /> Refresh
          </Button>
          <Button onClick={() => router.push("/delivery-orders")}>
            <Plus size={16} /> Generate From DO
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") setSearch(searchInput.trim());
            }}
            placeholder="Search invoice, DO, or customer"
            className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-blue-500"
          />
        </label>
        <Select
          value={status}
          onChange={(event) =>
            setStatus(event.target.value as "" | InvoiceStatus)
          }
          wrapperClassName="sm:w-48"
          className="h-10 py-2"
        >
          <option value="">All Statuses</option>
          <option value="UNPAID">Pending</option>
          <option value="PARTIAL">Partial</option>
          <option value="PAID">Paid</option>
          <option value="VOID">Voided</option>
        </Select>
        <Button
          variant="outline"
          onClick={() => setSearch(searchInput.trim())}
        >
          Filter
        </Button>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="flex items-center gap-2 font-semibold text-slate-900">
            <FileText size={18} className="text-blue-600" />
            Invoice register
          </h2>
          <span className="text-sm text-slate-500">{invoices.length} invoices</span>
        </div>
        {loading ? (
          <div className="flex min-h-60 items-center justify-center">
            <Spinner />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-[11px] uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3">Invoice</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">DO Ref</th>
                  <th className="px-5 py-3 text-right">Total</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="h-32 text-center text-slate-400">
                      No invoices yet. Generate one from a delivery order.
                    </td>
                  </tr>
                ) : (
                  invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b border-slate-100">
                      <td className="px-5 py-3 font-semibold text-blue-600">
                        {invoice.invoiceNumber}
                      </td>
                      <td className="px-5 py-3 text-slate-600">
                        {formatDate(invoice.invoiceDate)}
                      </td>
                      <td className="px-5 py-3 font-medium">
                        {invoice.customerName}
                      </td>
                      <td className="px-5 py-3 font-mono text-xs">
                        {invoice.deliveryNumber}
                      </td>
                      <td className="px-5 py-3 text-right font-semibold">
                        {money(invoice.totalAmount)}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={invoice.status} />
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link
                          href={`/invoices/${invoice.id}`}
                          className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600"
                        >
                          <Eye size={14} /> View
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function StatusBadge({ status }: { status: InvoiceStatus }) {
  const styles: Record<InvoiceStatus, string> = {
    UNPAID: "bg-rose-50 text-rose-700",
    PARTIAL: "bg-amber-50 text-amber-700",
    PAID: "bg-emerald-50 text-emerald-700",
    VOID: "bg-slate-100 text-slate-500",
  };
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${styles[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
