"use client";

import { RefreshCw, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";

import {
  Button,
  Input,
  Modal,
  Select,
  Spinner,
  Textarea,
} from "@/components/ui";
import {
  createItemReturn,
  getItemReturns,
  getReturnableAssets,
} from "@/lib/item-returns";
import type {
  ItemReturnListItem,
  ReturnableAsset,
} from "@/types/item-returns";

export default function ItemReturnsPage() {
  const [records, setRecords] = useState<ItemReturnListItem[]>([]);
  const [assets, setAssets] = useState<ReturnableAsset[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assetId, setAssetId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [returnResult, assetResult] = await Promise.all([
        getItemReturns(),
        getReturnableAssets(),
      ]);
      setRecords(returnResult);
      setAssets(assetResult);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load item returns.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const selected = assets.find((asset) => asset.id === assetId);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await createItemReturn({
        assetId,
        quantity: Number(quantity),
        returnDate: new Date().toISOString().slice(0, 10),
        reason: reason.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      setOpen(false);
      setAssetId("");
      setQuantity("1");
      setReason("");
      setNotes("");
      await load();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save return.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Item Returns</h1>
          <p className="mt-1 text-sm text-slate-600">
            Receive delivered items back into company inventory.
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
          <Button onClick={() => setOpen(true)} disabled={!assets.length}>
            <RotateCcw size={17} /> Record Return
          </Button>
        </div>
      </div>
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      <section className="overflow-hidden rounded-2xl bg-white shadow-[0_18px_48px_rgba(15,23,42,.1)]">
        {loading ? (
          <div className="flex min-h-60 items-center justify-center">
            <Spinner />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase text-slate-500">
                <th className="p-4">Return No.</th>
                <th>Item</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Quantity</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {records.length ? (
                records.map((record) => (
                  <tr className="border-b border-slate-100" key={record.id}>
                    <td className="p-4 font-semibold text-blue-600">
                      {record.returnNumber}
                    </td>
                    <td>
                      {record.itemName}
                      {record.serialNumber ? ` — ${record.serialNumber}` : ""}
                    </td>
                    <td>{record.returnDate}</td>
                    <td>{record.customerName ?? "—"}</td>
                    <td>{record.quantity}</td>
                    <td>{record.reason ?? "—"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="h-32 text-center text-slate-400">
                    No item returns recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </section>
      <Modal
        open={open}
        title="Record Item Return"
        description="Returned stock is restored to inventory immediately."
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="return-form" loading={saving}>
              Save Return
            </Button>
          </>
        }
      >
        <form
          id="return-form"
          onSubmit={(event) => void submit(event)}
          className="space-y-4"
        >
          <Select
            label="Delivered Item"
            required
            value={assetId}
            onChange={(event) => setAssetId(event.target.value)}
          >
            <option value="">Select item</option>
            {assets.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.itemName} ({asset.soldQuantity} delivered)
              </option>
            ))}
          </Select>
          <Input
            label="Return Quantity"
            type="number"
            min="1"
            max={selected?.soldQuantity}
            required
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
          />
          <Input
            label="Reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="e.g. Customer return"
          />
          <Textarea
            label="Notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </form>
      </Modal>
    </div>
  );
}
