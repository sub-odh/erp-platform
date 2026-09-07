"use client";

import { ClipboardCheck, PackagePlus, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { GoodsReceiptModal } from "@/components/inventory/goods-receipt-modal";
import { Button, Spinner } from "@/components/ui";
import { getGoodsReceipts } from "@/lib/goods-receipts";
import { getPurchaseOrders } from "@/lib/purchase-orders";
import type { GoodsReceiptListItem } from "@/types/goods-receipts";
import type { PurchaseOrderListItem } from "@/types/purchase-orders";

export default function GoodsReceiptsPage() {
  const [receipts, setReceipts] = useState<GoodsReceiptListItem[]>([]);
  const [orders, setOrders] = useState<PurchaseOrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [receiptResult, orderResult] = await Promise.all([
        getGoodsReceipts(),
        getPurchaseOrders({ limit: 100 }),
      ]);
      setReceipts(receiptResult);
      setOrders(orderResult.data);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load goods receipts.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => void load(), [load]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Goods Receipts</h1>
          <p className="mt-1 text-sm text-slate-600">
            Receive purchase-order deliveries and add accepted stock to
            inventory.
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
          <Button onClick={() => setModalOpen(true)}>
            <PackagePlus size={17} /> Receive Goods
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
            <ClipboardCheck size={20} className="text-blue-600" /> Receiving Log
          </h2>
          <span className="text-sm text-slate-500">
            {receipts.length} receipts
          </span>
        </div>
        {loading ? (
          <div className="flex min-h-60 items-center justify-center">
            <Spinner />
          </div>
        ) : (
          <div className="overflow-x-auto p-4">
            <table className="w-full min-w-[780px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-3">Receipt Number</th>
                  <th className="px-3 py-3">Received Date</th>
                  <th className="px-3 py-3">Purchase Order</th>
                  <th className="px-3 py-3">Vendor</th>
                  <th className="px-3 py-3 text-right">Items Received</th>
                  <th className="px-3 py-3">Delivery Note</th>
                </tr>
              </thead>
              <tbody>
                {receipts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="h-32 text-center text-slate-400">
                      No goods receipts recorded yet.
                    </td>
                  </tr>
                ) : (
                  receipts.map((receipt) => (
                    <tr key={receipt.id} className="border-b border-slate-100">
                      <td className="px-3 py-4 font-semibold text-blue-600">
                        {receipt.receiptNumber}
                      </td>
                      <td className="px-3 py-4">
                        {formatDate(receipt.receivedDate)}
                      </td>
                      <td className="px-3 py-4 font-medium">
                        {receipt.poNumber}
                      </td>
                      <td className="px-3 py-4">{receipt.vendorName}</td>
                      <td className="px-3 py-4 text-right font-semibold">
                        {receipt.totalQuantity}
                      </td>
                      <td className="px-3 py-4 text-slate-500">
                        {receipt.deliveryNote ?? "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <GoodsReceiptModal
        open={modalOpen}
        orders={orders}
        onClose={() => setModalOpen(false)}
        onReceived={() => void load()}
      />
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
