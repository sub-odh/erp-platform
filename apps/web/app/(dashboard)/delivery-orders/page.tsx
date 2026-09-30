"use client";

import { Ban, Eye, Lock, Pencil, Trash2, User } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { AuthenticatedImage } from "@/components/media/authenticated-image";
import { DoDeleteView } from "@/components/delivery-orders/do-delete-view";
import { DoVoidView } from "@/components/delivery-orders/do-void-view";
import { Spinner } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import { formatCurrency } from "@/lib/currency";
import {
  getDeliveryOrders,
  purgeDeliveryOrder,
  voidDeliveryOrder,
} from "@/lib/delivery-orders";
import type { DeliveryOrderListItem } from "@/types/delivery-orders";

const ROLE_1 = new Set(["OWNER", "SUPER_ADMIN", "ADMIN"]);
const ROLE_EDIT = new Set([
  "OWNER",
  "SUPER_ADMIN",
  "ADMIN",
  "HR",
  "OPERATIONS",
  "MANAGER",
  "MANAGEMENT",
]);
const ROLE_GENERATE = new Set([
  "OWNER",
  "SUPER_ADMIN",
  "ADMIN",
  "HR",
  "OPERATIONS",
  "MANAGER",
]);

function formatDoDate(value: string): string {
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  const text = date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  return text.replace(/ ([A-Za-z]+) /, " $1, ");
}

function statusTone(status: string): string {
  if (status === "Delivered") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "Draft") return "border-slate-200 bg-slate-50 text-slate-600";
  if (status === "Cancelled") return "border-red-200 bg-red-50 text-red-700";
  if (status === "Voided") return "border-slate-700 bg-slate-800 text-white";
  return "border-amber-200 bg-amber-50 text-amber-800";
}

export default function DeliveryOrdersPage() {
  const [orders, setOrders] = useState<DeliveryOrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<string | null>(null);
  const [soldBy, setSoldBy] = useState<DeliveryOrderListItem | null>(null);
  const [voidTarget, setVoidTarget] = useState<DeliveryOrderListItem | null>(null);
  const [voidError, setVoidError] = useState<string | null>(null);
  const [voiding, setVoiding] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeliveryOrderListItem | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setOrders(await getDeliveryOrders());
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load delivery orders.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setRole(getStoredUser()?.role ?? null);
    void load();
  }, [load]);

  const needle = query.trim().toLowerCase();
  const visible = needle
    ? orders.filter((order) =>
        `${order.deliveryNumber} ${order.customerName} ${order.status}`.toLowerCase().includes(needle),
      )
    : orders;
  const deliveredValue = orders.reduce((sum, order) => sum + Number(order.grandTotal || 0), 0);

  async function confirmVoid() {
    if (!voidTarget) return;
    setVoiding(true);
    setVoidError(null);
    try {
      await voidDeliveryOrder(voidTarget.id);
      setVoidTarget(null);
      await load();
    } catch (reason: unknown) {
      setVoidError(reason instanceof ApiError ? reason.message : "Unable to void this order.");
    } finally {
      setVoiding(false);
    }
  }

  async function confirmDelete(password: string) {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await purgeDeliveryOrder(deleteTarget.id, password);
      setOrders((current) => current.filter((order) => order.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (reason: unknown) {
      setDeleteError(reason instanceof ApiError ? reason.message : "Incorrect Password");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Delivery Orders</h1>
          <p className="text-sm text-slate-500">Total Value: {formatCurrency(deliveredValue)}</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search orders..."
            className="h-9 w-60 rounded-full border border-slate-300 px-4 text-sm"
          />
          <Link href="/delivery-orders/new" className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white">
            Create New DO
          </Link>
        </div>
      </div>
      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      <section className="overflow-x-auto rounded-xl bg-white shadow-sm">
        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-[11px] uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">S.No.</th>
                <th className="px-5 py-3">DO Number</th>
                <th className="px-5 py-3">Client Name</th>
                <th className="px-5 py-3">Delivery Date</th>
                <th className="px-5 py-3">Billing</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-500">No delivery orders found.</td>
                </tr>
              ) : (
                visible.map((order, index) => {
                  const voided = order.isVoided === 1;
                  const hasInvoice = Boolean(order.invoiceId);
                  const canEdit = role != null && ROLE_EDIT.has(role);
                  const canGenerate = role != null && ROLE_GENERATE.has(role);
                  const salesperson = order.soldByName || "Unassigned";
                  return (
                    <tr key={order.id} className={`border-t border-slate-100 ${voided ? "opacity-50" : ""}`}>
                      <td className="px-5 py-3">{index + 1}.</td>
                      <td className="px-5 py-3 font-bold">{order.deliveryNumber}</td>
                      <td className="px-5 py-3">{order.customerName || "N/A"}</td>
                      <td className="px-5 py-3">{order.deliveryDate ? formatDoDate(order.deliveryDate) : "-"}</td>
                      <td className="px-5 py-3">
                        {voided ? (
                          <span className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">Voided</span>
                        ) : (
                          <span className={`rounded px-2 py-1 text-xs ${order.isBillable === 1 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                            {order.isBillable === 1 ? "Billable" : "Non-Billable"}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`rounded border px-2 py-1 text-xs ${statusTone(order.status)}`}>{order.status || "Pending"}</span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            title={`${salesperson}${order.soldByDesignation ? ` — ${order.soldByDesignation}` : ""}`}
                            aria-label="Assigned Salesperson"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-blue-700"
                            onClick={() => setSoldBy(order)}
                          >
                            <User size={14} />
                          </button>
                          <Link href={`/delivery-orders/${order.id}`} title="View DO" aria-label="View DO" className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-600">
                            <Eye size={14} />
                          </Link>
                          {canEdit ? (
                            <Link href={`/delivery-orders/${order.id}/edit`} title="Edit DO" aria-label="Edit DO" className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-amber-300 text-amber-600">
                              <Pencil size={14} />
                            </Link>
                          ) : null}
                          {voided ? (
                            <span title="Already Voided" className="inline-flex h-8 w-8 cursor-not-allowed items-center justify-center rounded-md border border-slate-200 text-slate-300">
                              <Ban size={14} />
                            </span>
                          ) : hasInvoice ? (
                            <span title="Invoice exists. Void from Recovery List." className="inline-flex h-8 w-8 cursor-not-allowed items-center justify-center rounded-md border border-slate-200 text-slate-300">
                              <Lock size={14} />
                            </span>
                          ) : (
                            <button
                              type="button"
                              title="Void Delivery Order"
                              aria-label="Void Delivery Order"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-red-600"
                              onClick={() => {
                                setVoidError(null);
                                setVoidTarget(order);
                              }}
                            >
                              <Ban size={14} />
                            </button>
                          )}
                          {order.isBillable === 1 ? (
                            hasInvoice ? (
                              <Link href={`/invoices/${order.invoiceId}`} className="inline-flex min-w-[135px] items-center justify-center rounded-md bg-cyan-500 px-3 py-1.5 text-[11px] font-bold uppercase text-white">
                                View Invoice
                              </Link>
                            ) : canGenerate && !voided ? (
                              <Link href={`/delivery-orders/${order.id}/edit`} className="inline-flex min-w-[135px] items-center justify-center rounded-md bg-amber-400 px-3 py-1.5 text-[11px] font-bold uppercase text-black">
                                Generate Invoice
                              </Link>
                            ) : voided ? (
                              <button type="button" disabled className="inline-flex min-w-[135px] items-center justify-center rounded-md border px-3 py-1.5 text-[11px] font-bold uppercase text-slate-400">
                                Voided
                              </button>
                            ) : (
                              <button type="button" disabled title="Access Denied" className="inline-flex min-w-[135px] cursor-not-allowed items-center justify-center rounded-md border px-3 py-1.5 text-[11px] font-bold uppercase text-slate-400">
                                <Lock size={12} className="mr-1" /> Generate
                              </button>
                            )
                          ) : (
                            <button type="button" disabled className="inline-flex min-w-[135px] items-center justify-center rounded-md border px-3 py-1.5 text-[11px] font-bold uppercase text-slate-400">
                              <Ban size={12} className="mr-1" /> No Invoice
                            </button>
                          )}
                          {role && ROLE_1.has(role) ? (
                            <button
                              type="button"
                              aria-label="Delete Delivery Order"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-300 text-red-600"
                              onClick={() => {
                                setDeleteError(null);
                                setDeleteTarget(order);
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </section>
      {soldBy ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <button type="button" aria-label="Close" className="absolute inset-0 bg-slate-950/40" onClick={() => setSoldBy(null)} />
          <div className="relative z-10 w-full max-w-xs rounded-2xl border border-white/40 bg-white/80 p-6 text-center shadow-xl backdrop-blur">
            <button type="button" aria-label="Close" className="absolute right-3 top-3" onClick={() => setSoldBy(null)}>×</button>
            <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-slate-100 text-slate-400 shadow">
              {soldBy.soldByPhoto ? (
                <AuthenticatedImage src={soldBy.soldByPhoto} alt="" className="h-full w-full object-cover" />
              ) : (
                <User size={28} />
              )}
            </div>
            <h2 className="font-bold text-slate-900">{soldBy.soldByName || "Unassigned"}</h2>
            <p className="text-sm text-slate-500">{soldBy.soldByDesignation || "Sales Executive"}</p>
            <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-blue-700">Assigned Salesperson</p>
          </div>
        </div>
      ) : null}
      <DoVoidView
        open={Boolean(voidTarget)}
        deliveryNumber={voidTarget?.deliveryNumber ?? ""}
        loading={voiding}
        error={voidError}
        onConfirm={() => void confirmVoid()}
        onClose={() => setVoidTarget(null)}
      />
      <DoDeleteView
        open={Boolean(deleteTarget)}
        deliveryNumber={deleteTarget?.deliveryNumber ?? ""}
        loading={deleting}
        error={deleteError}
        onConfirm={(password) => void confirmDelete(password)}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
