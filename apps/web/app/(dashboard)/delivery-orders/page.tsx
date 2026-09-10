"use client";

import { ClipboardList, PackagePlus, RefreshCw, Truck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Button, Spinner } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { formatCurrency } from "@/lib/currency";
import { getDeliverableAssets, getDeliveryOrders } from "@/lib/delivery-orders";
import { generateInvoice } from "@/lib/invoices";
import type {
  DeliverableAsset,
  DeliveryOrderListItem,
} from "@/types/delivery-orders";

export default function DeliveryOrdersPage() {
  const [orders, setOrders] = useState<DeliveryOrderListItem[]>([]);
  const [assets, setAssets] = useState<DeliverableAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [orderResult, assetResult] = await Promise.all([
        getDeliveryOrders(),
        getDeliverableAssets(),
      ]);
      setOrders(orderResult);
      setAssets(assetResult);
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

  useEffect(() => void load(), [load]);

  async function handleGenerate(deliveryOrderId: string): Promise<void> {
    setGeneratingId(deliveryOrderId);
    setError(null);
    try {
      const created = await generateInvoice(deliveryOrderId);
      await load();
      router.push(`/invoices/${created.id}`);
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Unable to generate invoice.",
      );
    } finally {
      setGeneratingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Delivery Orders</h1>
          <p className="mt-1 text-sm text-slate-600">
            Dispatch company inventory to customers and keep stock quantities
            accurate.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => void load()}
            loading={loading}
          >
            <RefreshCw size={16} /> Refresh
          </Button>
          <Button onClick={() => router.push("/delivery-orders/new")} disabled={assets.length === 0}>
            <PackagePlus size={17} /> Create New DO
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-2xl bg-white shadow-[0_18px_48px_rgba(15,23,42,0.10)]">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <ClipboardList size={20} className="text-blue-600" /> Dispatch Log
          </h2>
          <span className="text-sm text-slate-500">{orders.length} orders</span>
        </div>
        {loading ? (
          <div className="flex min-h-60 items-center justify-center">
            <Spinner />
          </div>
        ) : (
          <div className="overflow-x-auto p-4">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-3">Delivery Number</th>
                  <th className="px-3 py-3">Delivery Date</th>
                  <th className="px-3 py-3">Customer / Recipient</th>
                  <th className="px-3 py-3">Contact Person</th>
                  <th className="px-3 py-3 text-right">Items Delivered</th>
                  <th className="px-3 py-3 text-right">Value</th>
                  <th className="px-3 py-3 text-center">Invoice</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="h-32 text-center text-slate-400">
                      No delivery orders recorded yet.
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id} className="border-b border-slate-100">
                      <td className="px-3 py-4 font-semibold text-blue-600">
                        {order.deliveryNumber}
                      </td>
                      <td className="px-3 py-4">
                        {formatDate(order.deliveryDate)}
                      </td>
                      <td className="px-3 py-4 font-medium">
                        {order.customerName}
                      </td>
                      <td className="px-3 py-4 text-slate-600">
                        {order.contactName ?? "—"}
                      </td>
                      <td className="px-3 py-4 text-right font-semibold">
                        {order.totalQuantity}
                      </td>
                      <td className="px-3 py-4 text-right font-semibold">
                        {formatCurrency(order.totalValue)}
                      </td>
                      <td className="px-3 py-4 text-center">
                        {order.invoiceId ? (
                          <Link
                            href={`/invoices/${order.invoiceId}`}
                            className="inline-flex rounded-md bg-cyan-500 px-3 py-1 text-[11px] font-bold text-white"
                          >
                            View Invoice
                          </Link>
                        ) : (
                          <button
                            type="button"
                            disabled={generatingId === order.id}
                            onClick={() => void handleGenerate(order.id)}
                            className="inline-flex rounded-md bg-amber-400 px-3 py-1 text-[11px] font-bold text-slate-900 disabled:opacity-60"
                          >
                            {generatingId === order.id
                              ? "Generating..."
                              : "Generate Invoice"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {!loading && assets.length === 0 ? (
        <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          <Truck size={18} className="mt-0.5 shrink-0" />
          Receive goods or add inventory first, then create a delivery order
          from available stock.
        </div>
      ) : null}

    </div>
  );
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}