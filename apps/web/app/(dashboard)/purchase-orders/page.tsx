"use client";

import { FileSpreadsheet, FileText, Pencil, Plus, Printer, RotateCcw, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { PiDeleteView } from "@/components/purchase-orders/po-delete-view";
import { PiRecordView } from "@/components/purchase-orders/po-record-view";
import { Button, Input, Spinner } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import { customerFirstLine, formatPiAmount } from "@/lib/pi-format";
import {
  getProformaInvoice,
  listProformaInvoices,
  purgeProformaInvoice,
} from "@/lib/purchase-orders";
import type { ProformaCurrency, ProformaDetails, ProformaListItem } from "@/types/proforma-invoices";

const SORTS = ["pi_number", "pi_date", "customer_details", "total_amount", "first_name"] as const;

export default function ProformaInvoicesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchCustomer = searchParams.get("search_customer") ?? "";
  const searchPiNum = searchParams.get("search_pi_num") ?? "";
  const startDate = searchParams.get("start_date") ?? "";
  const endDate = searchParams.get("end_date") ?? "";
  const sort = SORTS.includes((searchParams.get("sort") ?? "") as (typeof SORTS)[number])
    ? (searchParams.get("sort") as (typeof SORTS)[number])
    : "pi_date";
  const direction = searchParams.get("direction") === "asc" ? "asc" : "desc";
  const toggle = direction === "desc" ? "asc" : "desc";

  const [rows, setRows] = useState<ProformaListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [filters, setFilters] = useState({ searchCustomer, searchPiNum, startDate, endDate });
  const [record, setRecord] = useState<ProformaDetails | null>(null);
  const [recordOpen, setRecordOpen] = useState(false);
  const [recordError, setRecordError] = useState<string | null>(null);
  const [recordLoading, setRecordLoading] = useState(false);
  const [purgeTarget, setPurgeTarget] = useState<ProformaListItem | null>(null);
  const [purgeError, setPurgeError] = useState<string | null>(null);
  const [purging, setPurging] = useState(false);
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    setCanEdit(getStoredUser()?.role !== "HEAD");
  }, []);

  useEffect(() => {
    setFilters({ searchCustomer, searchPiNum, startDate, endDate });
  }, [searchCustomer, searchPiNum, startDate, endDate]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    listProformaInvoices({
      searchCustomer,
      searchPiNum,
      startDate,
      endDate,
      sort,
      direction,
    })
      .then((result) => {
        if (active) setRows(result);
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setError(reason instanceof ApiError ? reason.message : "The purchase orders could not be loaded.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [direction, endDate, searchCustomer, searchPiNum, sort, startDate]);

  function applyFilters(event: FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (filters.searchCustomer) params.set("search_customer", filters.searchCustomer);
    if (filters.searchPiNum) params.set("search_pi_num", filters.searchPiNum);
    if (filters.startDate) params.set("start_date", filters.startDate);
    if (filters.endDate) params.set("end_date", filters.endDate);
    if (sort !== "pi_date") params.set("sort", sort);
    if (direction !== "desc") params.set("direction", direction);
    router.push(params.size ? `/purchase-orders?${params}` : "/purchase-orders");
  }

  function sortHref(column: (typeof SORTS)[number]): string {
    const params = new URLSearchParams();
    params.set("sort", column);
    params.set("direction", toggle);
    if (searchCustomer) params.set("search_customer", searchCustomer);
    if (searchPiNum) params.set("search_pi_num", searchPiNum);
    if (startDate) params.set("start_date", startDate);
    if (endDate) params.set("end_date", endDate);
    return `/purchase-orders?${params}`;
  }

  async function openRecord(id: string) {
    setRecordOpen(true);
    setRecord(null);
    setRecordError(null);
    setRecordLoading(true);
    try {
      setRecord(await getProformaInvoice(id));
    } catch (reason: unknown) {
      setRecordError(
        reason instanceof ApiError ? reason.message : "System error fetching record details.",
      );
    } finally {
      setRecordLoading(false);
    }
  }

  async function purge(password: string) {
    if (!purgeTarget) return;
    setPurging(true);
    setPurgeError(null);
    try {
      const result = await purgeProformaInvoice(purgeTarget.id, password);
      setRows((current) => current.filter((row) => row.id !== purgeTarget.id));
      setPurgeTarget(null);
      setNotice(result.message);
    } catch (reason: unknown) {
      setPurgeError(
        reason instanceof ApiError
          ? reason.message
          : "Transmission breakdown encountered processing security routine.",
      );
    } finally {
      setPurging(false);
    }
  }

  function exportExcel() {
    const body = rows
      .map(
        (row) =>
          `<tr><td>${escapeHtml(row.piNumber)}</td><td>${escapeHtml(row.piDate)}</td><td>${escapeHtml(customerFirstLine(row.customerDetails))}</td><td>${escapeHtml(row.creatorName)}</td><td>${escapeHtml(formatPiAmount(row.totalAmount, row.currency))}</td></tr>`,
      )
      .join("");
    const html = `<table><tr><th>PO Number</th><th>Date</th><th>Vendor</th><th>Generated By</th><th>Valuation</th></tr>${body}</table>`;
    const blob = new Blob([html], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Purchase_Orders_Ledger_${new Date().toISOString().slice(0, 10)}.xls`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function exportPdf() {
    const style = document.createElement("style");
    style.id = "dashboard-runtime-print-override";
    style.textContent = `@media print { aside, header, .pi-no-print { display: none !important; } #pi-ledger-table { width: 100%; } .pi-actions { display: none !important; } }`;
    document.head.appendChild(style);
    window.print();
    window.setTimeout(() => style.remove(), 1000);
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Purchase Orders Dashboard</h1>
          <p className="text-sm text-slate-500">
            Click on any invoice row to instantly view the detailed purchase order profile summary.
          </p>
        </div>
        <Link href="/purchase-orders/new">
          <Button size="sm">
            <Plus size={14} /> Generate New PO
          </Button>
        </Link>
      </div>
      {notice ? (
        <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{notice}</p>
      ) : null}
      {error ? (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}
      <form onSubmit={applyFilters} className="mb-4 grid gap-3 rounded-xl border border-slate-200 bg-white p-3 md:grid-cols-5">
        <Input label="Vendor" value={filters.searchCustomer} placeholder="Search vendor..." onChange={(event) => setFilters((current) => ({ ...current, searchCustomer: event.target.value }))} />
        <Input label="PO Number" value={filters.searchPiNum} placeholder="e.g. PO-2026-001" onChange={(event) => setFilters((current) => ({ ...current, searchPiNum: event.target.value }))} />
        <Input type="date" label="From Date" value={filters.startDate} onChange={(event) => setFilters((current) => ({ ...current, startDate: event.target.value }))} />
        <Input type="date" label="To Date" value={filters.endDate} onChange={(event) => setFilters((current) => ({ ...current, endDate: event.target.value }))} />
        <div className="flex items-end gap-2">
          <Button type="submit" variant="secondary" size="sm" className="flex-1">
            Apply Filters
          </Button>
          <Link href="/purchase-orders" aria-label="Reset filters" className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-600">
            <RotateCcw size={14} />
          </Link>
        </div>
      </form>
      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-4">
          <h2 className="font-bold text-slate-900">Purchase Orders Log</h2>
          <div className="pi-no-print flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={exportExcel}>
              <FileSpreadsheet size={14} /> Export Excel
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={exportPdf}>
              <FileText size={14} /> Export PDF
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto p-3">
          {loading ? (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          ) : (
            <table id="pi-ledger-table" className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-slate-500">
                <tr>
                  <SortHeader href={sortHref("pi_number")} label="PO Number" />
                  <SortHeader href={sortHref("pi_date")} label="Date" />
                  <SortHeader href={sortHref("customer_details")} label="Vendor" />
                  <SortHeader href={sortHref("first_name")} label="Generated By" />
                  <SortHeader href={sortHref("total_amount")} label="Valuation" align="right" />
                  <th className="pi-actions px-2 py-2 text-center">Actions Workflow</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-2 py-8 text-center text-slate-500">
                      No formalized purchase order metrics returned matching defined filter queries.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr
                      key={row.id}
                      className="cursor-pointer border-t border-slate-100 hover:bg-blue-50/40"
                      onClick={() => void openRecord(row.id)}
                    >
                      <td className="px-2 py-2 font-bold text-blue-700">{row.piNumber}</td>
                      <td className="px-2 py-2 text-slate-500">{row.piDate}</td>
                      <td className="px-2 py-2 font-bold">{customerFirstLine(row.customerDetails)}</td>
                      <td className="px-2 py-2">{row.creatorName}</td>
                      <td className="px-2 py-2 text-right font-bold">
                        {formatPiAmount(row.totalAmount, row.currency as ProformaCurrency)}
                      </td>
                      <td className="pi-actions px-2 py-2 text-center" onClick={(event) => event.stopPropagation()}>
                        <div className="inline-flex gap-1">
                          <Link href={`/purchase-orders/${row.id}/print`} target="_blank" aria-label="Print Purchase Order Blueprint" className="rounded p-1 text-blue-700">
                            <Printer size={16} />
                          </Link>
                          {canEdit ? (
                            <Link href={`/purchase-orders/${row.id}/edit`} aria-label="Edit Purchase Order" className="rounded p-1 text-sky-700">
                              <Pencil size={16} />
                            </Link>
                          ) : null}
                          <button
                            type="button"
                            aria-label="Purge Record System Ledger"
                            className="rounded p-1 text-red-600"
                            onClick={() => {
                              setPurgeError(null);
                              setPurgeTarget(row);
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>
      {recordOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <button type="button" aria-label="Close record" className="absolute inset-0 bg-slate-950/60" onClick={() => setRecordOpen(false)} />
          <div className="relative z-10 flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between bg-slate-50 px-4 py-3">
              <h2 className="font-bold text-slate-900">Purchase Order Record</h2>
              <button type="button" aria-label="Close" onClick={() => setRecordOpen(false)}>×</button>
            </div>
            <div id="pi-view-print" className="overflow-y-auto px-4 py-4">
              {recordLoading ? (
                <div className="flex justify-center py-10">
                  <Spinner />
                </div>
              ) : null}
              {recordError ? <p className="text-sm text-red-700">{recordError}</p> : null}
              {record ? <PiRecordView invoice={record} /> : null}
            </div>
            <div className="flex justify-end gap-2 bg-slate-50 px-4 py-2">
              {record ? (
                <Link href={`/purchase-orders/${record.id}/print`} target="_blank">
                  <Button size="sm" variant="secondary">
                    <Printer size={14} /> Print / Save PDF
                  </Button>
                </Link>
              ) : null}
              <Button size="sm" variant="secondary" onClick={() => setRecordOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      ) : null}
      <PiDeleteView
        open={Boolean(purgeTarget)}
        piNumber={purgeTarget?.piNumber ?? ""}
        loading={purging}
        error={purgeError}
        onConfirm={(password) => void purge(password)}
        onClose={() => setPurgeTarget(null)}
      />
    </div>
  );
}

function SortHeader({
  href,
  label,
  align = "left",
}: {
  href: string;
  label: string;
  align?: "left" | "right";
}) {
  return (
    <th className={["px-2 py-2", align === "right" ? "text-right" : ""].join(" ")}>
      <Link href={href} className="text-slate-500">
        {label}
      </Link>
    </th>
  );
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
