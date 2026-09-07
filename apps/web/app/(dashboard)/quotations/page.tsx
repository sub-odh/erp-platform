"use client";

import { Eye, FileText, Filter, Plus, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button, Select } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { deleteQuotation, getQuotations } from "@/lib/quotations";
import type { QuotationListItem, QuotationStatus } from "@/types/quotations";

const money = (value: number) =>
  `Rs. ${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function QuotationsPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusInput, setStatusInput] = useState<"" | QuotationStatus>("");
  const [status, setStatus] = useState<"" | QuotationStatus>("");
  const [quotations, setQuotations] = useState<QuotationListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getQuotations({
        search,
        status: status || undefined,
        limit: 100,
      });
      setQuotations(result.data);
      setTotal(result.pagination.total);
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Unable to load quotations.",
      );
    } finally {
      setLoading(false);
    }
  }, [search, status]);
  useEffect(() => {
    void load();
  }, [load]);

  const pipelineTotal = useMemo(
    () => quotations.reduce((sum, quotation) => sum + quotation.totalAmount, 0),
    [quotations],
  );
  const expiredTotal = useMemo(
    () =>
      quotations.filter(
        (quotation) =>
          quotation.status === "EXPIRED" ||
          (quotation.status === "ACTIVE" &&
            quotation.expiryDate < new Date().toISOString().slice(0, 10)),
      ).length,
    [quotations],
  );

  async function remove(quotation: QuotationListItem) {
    if (!window.confirm(`Delete quotation ${quotation.quotationNumber}?`))
      return;
    try {
      await deleteQuotation(quotation.id);
      await load();
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Unable to delete quotation.",
      );
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Commercial Quotation Pipeline
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Track, organize, and output customer proposals with VAT evaluation
            and commercial terms.
          </p>
        </div>
        <Link
          href="/quotations/new"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white transition hover:bg-emerald-700"
        >
          <Plus size={16} />
          Generate New Quotation
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Stat label="Total Proposals Filed" value={String(total)} tone="blue" />
        <Stat
          label="Gross Pipeline Valuation (Inc. VAT)"
          value={money(pipelineTotal)}
          tone="green"
        />
        <Stat
          label="Expired Boundary Records"
          value={String(expiredTotal)}
          tone="red"
        />
      </div>
      <section className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm lg:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Search quotations</span>
          <Search
            size={16}
            aria-hidden="true"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") setSearch(searchInput);
            }}
            placeholder="Search tracking ID number or customer profiles..."
            className="h-10 w-full rounded-md border border-slate-200 pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </label>
        <Select
          aria-label="Quotation Status"
          value={statusInput}
          onChange={(event) =>
            setStatusInput(event.target.value as "" | QuotationStatus)
          }
          wrapperClassName="lg:w-80"
          className="h-10 py-2"
        >
          <option value="">All Boundary Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="ACCEPTED">Accepted</option>
          <option value="REJECTED">Rejected</option>
          <option value="EXPIRED">Expired</option>
          <option value="CANCELLED">Cancelled</option>
        </Select>
        <Button
          variant="secondary"
          className="lg:min-w-44"
          onClick={() => {
            setSearch(searchInput);
            setStatus(statusInput);
          }}
        >
          <Filter size={15} />
          Query Filter
        </Button>
      </section>
      {error ? (
        <div
          role="alert"
          className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
        >
          {error}
        </div>
      ) : null}
      <section className="overflow-hidden rounded-xl bg-white shadow-sm">
        <h2 className="border-b border-slate-100 px-4 py-4 font-semibold text-slate-900">
          <FileText size={17} className="mr-2 inline text-blue-600" />
          Active Pipeline Quotations Manifest
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Tracking ID</th>
                <th className="px-4 py-3">Issue Date</th>
                <th className="px-4 py-3">Expiry Date</th>
                <th className="px-4 py-3">Client / Customer Reference</th>
                <th className="px-4 py-3 text-right">Grand Total</th>
                <th className="px-4 py-3">State</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="h-40 text-center text-slate-400">
                    Loading quotations…
                  </td>
                </tr>
              ) : quotations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="h-40 text-center text-slate-400">
                    No quotations created yet.
                  </td>
                </tr>
              ) : (
                quotations.map((quotation) => (
                  <tr key={quotation.id} className="border-t border-slate-100">
                    <td className="px-4 py-4 font-semibold text-emerald-700">
                      {quotation.quotationNumber}
                    </td>
                    <td className="px-4 py-4">{quotation.issueDate}</td>
                    <td className="px-4 py-4">{quotation.expiryDate}</td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-slate-900">
                        {quotation.customerName}
                      </div>
                      <div className="text-xs text-slate-500">
                        {quotation.customerCode}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right font-semibold">
                      {money(quotation.totalAmount)}
                    </td>
                    <td className="px-4 py-4">
                      <Status status={quotation.status} />
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Link
                        href={`/quotations/${quotation.id}`}
                        className="mr-2 inline-flex rounded-md border border-blue-200 p-2 text-blue-600 hover:bg-blue-50"
                        aria-label={`View ${quotation.quotationNumber}`}
                      >
                        <Eye size={16} />
                      </Link>
                      <button
                        type="button"
                        onClick={() => void remove(quotation)}
                        className="rounded-md border border-rose-200 p-2 text-rose-600 hover:bg-rose-50"
                        aria-label={`Delete ${quotation.quotationNumber}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "blue" | "green" | "red";
}) {
  const toneClasses = {
    blue: "text-slate-900",
    green: "text-emerald-600",
    red: "text-rose-600",
  };
  return (
    <section className="rounded-xl bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className={`mt-2 text-xl font-bold ${toneClasses[tone]}`}>{value}</p>
    </section>
  );
}
function Status({ status }: { status: QuotationStatus }) {
  const classes: Record<QuotationStatus, string> = {
    ACTIVE: "bg-emerald-100 text-emerald-700",
    ACCEPTED: "bg-blue-100 text-blue-700",
    REJECTED: "bg-rose-100 text-rose-700",
    EXPIRED: "bg-amber-100 text-amber-700",
    CANCELLED: "bg-slate-100 text-slate-600",
  };
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${classes[status]}`}
    >
      {status[0] + status.slice(1).toLowerCase()}
    </span>
  );
}
