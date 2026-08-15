"use client";

import { FilePlus2, Filter, Search, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";

import { Button, Select, Spinner } from "@/components/ui";
import { formatRupees } from "@/lib/inventory-format";
import { getVendors } from "@/lib/master-data";
import { getPurchaseOrders } from "@/lib/purchase-orders";
import type { PaginationMeta, Vendor } from "@/types/master-data";
import type { PurchaseOrderListItem } from "@/types/purchase-orders";

const PAGE_SIZE = 20;

export default function PurchaseOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<PurchaseOrderListItem[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [result, vendorResult] = await Promise.all([
        getPurchaseOrders({
          search,
          vendorId,
          fromDate,
          toDate,
          page,
          limit: PAGE_SIZE,
        }),
        getVendors({ isActive: true, limit: 100 }),
      ]);
      setOrders(result.data);
      setMeta(result.pagination);
      setVendors(vendorResult.data);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load purchase orders.",
      );
    } finally {
      setLoading(false);
    }
  }, [fromDate, page, search, toDate, vendorId]);

  useEffect(() => void load(), [load]);
  function apply(event: FormEvent) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }
  function reset() {
    setSearchInput("");
    setSearch("");
    setVendorId("");
    setFromDate("");
    setToDate("");
    setPage(1);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Purchase Orders Dashboard
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Click on any order row to instantly view the detailed invoice
              profile summary.
            </p>
          </div>
        </div>
        <Link href="/purchase-orders/new">
          <Button className="px-5 shadow-md">
            <FilePlus2 size={17} /> Generate New PO
          </Button>
        </Link>
      </div>
      <form
        onSubmit={apply}
        className="grid gap-3 bg-white p-4 shadow-[0_8px_18px_rgba(15,23,42,0.07)] lg:grid-cols-[1.35fr_1fr_1fr_1fr_auto_auto] lg:items-end"
      >
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Vendor / Supplier
          </span>
          <Select
            value={vendorId}
            onChange={(event) => setVendorId(event.target.value)}
          >
            <option value="">All vendors</option>
            {vendors.map((vendor) => (
              <option key={vendor.id} value={vendor.id}>
                {vendor.name}
              </option>
            ))}
          </Select>
        </label>
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            PO Number
          </span>
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="e.g. PO-2026-0001"
              className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500"
            />
          </div>
        </label>
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            From Date
          </span>
          <input
            type="date"
            value={fromDate}
            onChange={(event) => {
              setFromDate(event.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            To Date
          </span>
          <input
            type="date"
            value={toDate}
            onChange={(event) => {
              setToDate(event.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
          />
        </label>
        <Button
          type="submit"
          variant="secondary"
          className="h-10 whitespace-nowrap"
        >
          <Filter size={16} /> Apply Filters
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          title="Reset filters"
          onClick={reset}
        >
          ↺
        </Button>
      </form>
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      <section className="overflow-hidden rounded-2xl bg-white shadow-[0_18px_48px_rgba(15,23,42,0.10)]">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <ShoppingCart size={20} className="text-slate-600" /> Procurement
            Log Matrix
          </h2>
          <span className="text-sm text-slate-500">
            {meta?.total ?? 0} orders
          </span>
        </div>
        {loading ? (
          <div className="flex min-h-60 items-center justify-center">
            <Spinner />
          </div>
        ) : (
          <div className="overflow-x-auto p-4">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-3">PO Number</th>
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3">Vendor Matrix</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3 text-right">Valuation (Rs.)</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="h-28 text-center text-slate-400">
                      No purchase orders found
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr
                      key={order.id}
                      tabIndex={0}
                      role="link"
                      onClick={() =>
                        router.push(`/purchase-orders/${order.id}`)
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          router.push(`/purchase-orders/${order.id}`);
                        }
                      }}
                      className="cursor-pointer border-b border-slate-100 transition hover:bg-slate-50 focus:outline-none focus-visible:bg-blue-50"
                    >
                      <td className="px-3 py-4 font-semibold text-blue-600">
                        {order.poNumber}
                      </td>
                      <td className="px-3 py-4">{formatDate(order.poDate)}</td>
                      <td className="px-3 py-4">
                        <p className="font-semibold text-[#16266b]">
                          {order.vendorName}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {order.vendorCode}
                        </p>
                      </td>
                      <td className="px-3 py-4">
                        <Status status={order.status} />
                      </td>
                      <td className="px-3 py-4 text-right font-semibold text-[#16266b]">
                        {formatRupees(order.totalAmount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {(meta?.totalPages ?? 0) > 1 ? (
        <div className="flex justify-end gap-3 text-sm text-slate-500">
          <Button
            size="sm"
            variant="outline"
            disabled={page <= 1 || loading}
            onClick={() => setPage((value) => value - 1)}
          >
            Previous
          </Button>
          <span className="py-2">
            Page {page} of {meta?.totalPages}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={page >= (meta?.totalPages ?? 1) || loading}
            onClick={() => setPage((value) => value + 1)}
          >
            Next
          </Button>
        </div>
      ) : null}
    </div>
  );
}
function Status({ status }: { status: PurchaseOrderListItem["status"] }) {
  const styles =
    status === "ISSUED"
      ? "bg-blue-50 text-blue-700 ring-blue-200"
      : status === "RECEIVED"
        ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
        : status === "CANCELLED"
          ? "bg-red-50 text-red-700 ring-red-200"
          : "bg-amber-50 text-amber-700 ring-amber-200";
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${styles}`}
    >
      {status.replaceAll("_", " ")}
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
