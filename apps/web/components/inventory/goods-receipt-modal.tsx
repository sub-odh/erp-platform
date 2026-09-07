"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";

import {
  Button,
  Input,
  Modal,
  Select,
  Spinner,
  Textarea,
} from "@/components/ui";
import { receiveGoods } from "@/lib/goods-receipts";
import { getPurchaseOrder } from "@/lib/purchase-orders";
import type {
  PurchaseOrderDetails,
  PurchaseOrderListItem,
} from "@/types/purchase-orders";

interface GoodsReceiptModalProps {
  open: boolean;
  orders: PurchaseOrderListItem[];
  onClose: () => void;
  onReceived: () => void;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function GoodsReceiptModal({
  open,
  orders,
  onClose,
  onReceived,
}: GoodsReceiptModalProps) {
  const [purchaseOrderId, setPurchaseOrderId] = useState("");
  const [order, setOrder] = useState<PurchaseOrderDetails | null>(null);
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [receivedDate, setReceivedDate] = useState(today);
  const [deliveryNote, setDeliveryNote] = useState("");
  const [notes, setNotes] = useState("");
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const outstandingItems = useMemo(
    () =>
      order?.items.filter((item) => item.quantity > item.receivedQuantity) ??
      [],
    [order],
  );

  useEffect(() => {
    if (!open) return;
    setPurchaseOrderId("");
    setOrder(null);
    setQuantities({});
    setReceivedDate(today());
    setDeliveryNote("");
    setNotes("");
    setError(null);
  }, [open]);

  async function selectPurchaseOrder(id: string) {
    setPurchaseOrderId(id);
    setOrder(null);
    setQuantities({});
    setError(null);
    if (!id) return;
    setLoadingOrder(true);
    try {
      const details = await getPurchaseOrder(id);
      setOrder(details);
      setQuantities(
        Object.fromEntries(
          details.items
            .filter((item) => item.quantity > item.receivedQuantity)
            .map((item) => [
              item.id,
              String(item.quantity - item.receivedQuantity),
            ]),
        ),
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load the purchase order.",
      );
    } finally {
      setLoadingOrder(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!order) {
      setError("Select an open purchase order first.");
      return;
    }
    const items = outstandingItems
      .map((item) => ({
        purchaseOrderItemId: item.id,
        quantity: Number(quantities[item.id] || 0),
      }))
      .filter((item) => Number.isInteger(item.quantity) && item.quantity > 0);
    if (items.length === 0) {
      setError("Enter a received quantity for at least one item.");
      return;
    }
    if (
      items.some((receivedItem) => {
        const item = outstandingItems.find(
          (candidate) => candidate.id === receivedItem.purchaseOrderItemId,
        );
        return (
          !item || receivedItem.quantity > item.quantity - item.receivedQuantity
        );
      })
    ) {
      setError("A received quantity cannot exceed the outstanding quantity.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await receiveGoods({
        purchaseOrderId: order.id,
        receivedDate,
        deliveryNote: deliveryNote.trim() || undefined,
        notes: notes.trim() || undefined,
        items,
      });
      onReceived();
      onClose();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to record this goods receipt.",
      );
    } finally {
      setSaving(false);
    }
  }

  const openOrders = orders.filter(
    (candidate) =>
      candidate.status === "ISSUED" ||
      candidate.status === "PARTIALLY_RECEIVED",
  );

  return (
    <Modal
      open={open}
      title="Receive Goods"
      description="Record delivered quantities and add them to company inventory."
      onClose={onClose}
      className="max-w-3xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="goods-receipt-form" loading={saving}>
            Save Goods Receipt
          </Button>
        </>
      }
    >
      <form
        id="goods-receipt-form"
        onSubmit={(event) => void submit(event)}
        className="space-y-5"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Purchase Order"
            value={purchaseOrderId}
            onChange={(event) => void selectPurchaseOrder(event.target.value)}
            required
            disabled={saving}
          >
            <option value="">Select purchase order</option>
            {openOrders.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.poNumber} — {candidate.vendorName}
              </option>
            ))}
          </Select>
          <Input
            label="Received Date"
            type="date"
            value={receivedDate}
            onChange={(event) => setReceivedDate(event.target.value)}
            required
            disabled={saving}
          />
          <Input
            label="Delivery Note / Challan"
            value={deliveryNote}
            onChange={(event) => setDeliveryNote(event.target.value)}
            placeholder="e.g. DN-1024"
            disabled={saving}
          />
        </div>

        {loadingOrder ? (
          <div className="flex min-h-36 items-center justify-center rounded-xl border border-dashed border-slate-300">
            <Spinner />
          </div>
        ) : null}

        {order && !loadingOrder ? (
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm">
              <span className="font-semibold text-slate-900">
                {order.poNumber}
              </span>
              <span className="ml-2 text-slate-500">{order.vendorName}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-sm">
                <thead className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3 text-right">Ordered</th>
                    <th className="px-4 py-3 text-right">Received</th>
                    <th className="px-4 py-3 text-right">Outstanding</th>
                    <th className="px-4 py-3 text-right">Receive Now</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {outstandingItems.map((item) => {
                    const outstanding = item.quantity - item.receivedQuantity;
                    return (
                      <tr key={item.id}>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900">
                            {item.productName}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {item.unitSymbol}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {item.receivedQuantity}
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {outstanding}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <input
                            type="number"
                            min="0"
                            max={outstanding}
                            step="1"
                            value={quantities[item.id] ?? ""}
                            onChange={(event) =>
                              setQuantities((current) => ({
                                ...current,
                                [item.id]: event.target.value,
                              }))
                            }
                            className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-right outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            disabled={saving}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        <Textarea
          label="Notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Condition, shortages, or receiving notes..."
          disabled={saving}
        />

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}
      </form>
    </Modal>
  );
}
