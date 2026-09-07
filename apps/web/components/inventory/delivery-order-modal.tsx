"use client";

import { Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";

import { Button, Input, Modal, Select, Textarea } from "@/components/ui";
import { createDeliveryOrder } from "@/lib/delivery-orders";
import type { DeliverableAsset } from "@/types/delivery-orders";

interface DeliveryOrderModalProps {
  open: boolean;
  assets: DeliverableAsset[];
  onClose: () => void;
  onCreated: () => void;
}

interface DeliveryLine {
  assetId: string;
  quantity: string;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function DeliveryOrderModal({
  open,
  assets,
  onClose,
  onCreated,
}: DeliveryOrderModalProps) {
  const [customerName, setCustomerName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryDate, setDeliveryDate] = useState(today);
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<DeliveryLine[]>([
    { assetId: "", quantity: "1" },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setCustomerName("");
    setContactName("");
    setContactPhone("");
    setDeliveryAddress("");
    setDeliveryDate(today());
    setNotes("");
    setLines([{ assetId: "", quantity: "1" }]);
    setError(null);
  }, [open]);

  const selectedIds = useMemo(
    () => new Set(lines.map((line) => line.assetId).filter(Boolean)),
    [lines],
  );

  function updateLine(index: number, patch: Partial<DeliveryLine>) {
    setLines((current) =>
      current.map((line, lineIndex) =>
        lineIndex === index ? { ...line, ...patch } : line,
      ),
    );
  }

  function removeLine(index: number) {
    setLines((current) =>
      current.filter((_, lineIndex) => lineIndex !== index),
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const items = lines.map((line) => ({
      assetId: line.assetId,
      quantity: Number(line.quantity),
    }));
    if (!customerName.trim()) {
      setError("Customer or recipient name is required.");
      return;
    }
    if (
      items.length === 0 ||
      items.some(
        (item) =>
          !item.assetId ||
          !Number.isInteger(item.quantity) ||
          item.quantity < 1,
      )
    ) {
      setError(
        "Select an inventory item and a valid delivery quantity for each line.",
      );
      return;
    }
    if (new Set(items.map((item) => item.assetId)).size !== items.length) {
      setError("Add each inventory item only once.");
      return;
    }
    const overStock = items.some((item) => {
      const asset = assets.find((candidate) => candidate.id === item.assetId);
      return !asset || item.quantity > asset.stockQuantity;
    });
    if (overStock) {
      setError("A delivery quantity cannot exceed the available stock.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await createDeliveryOrder({
        customerName: customerName.trim(),
        deliveryDate,
        contactName: contactName.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
        deliveryAddress: deliveryAddress.trim() || undefined,
        notes: notes.trim() || undefined,
        items,
      });
      onCreated();
      onClose();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to create the delivery order.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      title="Create Delivery Order"
      description="Record stock sent to a customer or recipient. Saved items are deducted from company inventory."
      onClose={onClose}
      className="max-w-4xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="delivery-order-form" loading={saving}>
            Save Delivery Order
          </Button>
        </>
      }
    >
      <form
        id="delivery-order-form"
        onSubmit={(event) => void submit(event)}
        className="space-y-5"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Input
            label="Customer / Recipient"
            value={customerName}
            onChange={(event) => setCustomerName(event.target.value)}
            placeholder="e.g. Acme Trading"
            required
            disabled={saving}
          />
          <Input
            label="Contact Person"
            value={contactName}
            onChange={(event) => setContactName(event.target.value)}
            disabled={saving}
          />
          <Input
            label="Contact Phone"
            value={contactPhone}
            onChange={(event) => setContactPhone(event.target.value)}
            disabled={saving}
          />
          <Input
            label="Delivery Date"
            type="date"
            value={deliveryDate}
            onChange={(event) => setDeliveryDate(event.target.value)}
            required
            disabled={saving}
          />
        </div>

        <Textarea
          label="Delivery Address"
          value={deliveryAddress}
          onChange={(event) => setDeliveryAddress(event.target.value)}
          placeholder="Customer delivery address"
          disabled={saving}
        />

        <div className="overflow-hidden rounded-xl border border-slate-200">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div>
              <h3 className="font-semibold text-slate-900">Delivery Items</h3>
              <p className="text-xs text-slate-500">
                Only items with available stock can be delivered.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                setLines((current) => [
                  ...current,
                  { assetId: "", quantity: "1" },
                ])
              }
              disabled={saving || lines.length >= assets.length}
            >
              <Plus size={15} /> Add Item
            </Button>
          </div>
          {assets.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-500">
              No stock is currently available to deliver.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {lines.map((line, index) => {
                const selected = assets.find(
                  (asset) => asset.id === line.assetId,
                );
                return (
                  <div
                    key={`${index}-${line.assetId}`}
                    className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_112px_40px] sm:items-end"
                  >
                    <Select
                      label={index === 0 ? "Inventory Item" : undefined}
                      value={line.assetId}
                      onChange={(event) =>
                        updateLine(index, { assetId: event.target.value })
                      }
                      disabled={saving}
                    >
                      <option value="">Select inventory item</option>
                      {assets.map((asset) => (
                        <option
                          key={asset.id}
                          value={asset.id}
                          disabled={
                            asset.id !== line.assetId &&
                            selectedIds.has(asset.id)
                          }
                        >
                          {asset.itemName}
                          {asset.serialNumber
                            ? ` — S/N ${asset.serialNumber}`
                            : ""}
                          {` (${asset.stockQuantity} available)`}
                        </option>
                      ))}
                    </Select>
                    <div>
                      <Input
                        label={index === 0 ? "Quantity" : undefined}
                        type="number"
                        min="1"
                        max={selected?.stockQuantity}
                        value={line.quantity}
                        onChange={(event) =>
                          updateLine(index, { quantity: event.target.value })
                        }
                        disabled={saving}
                      />
                      {selected ? (
                        <p className="mt-1 text-xs text-slate-500">
                          {selected.stockQuantity} available
                        </p>
                      ) : null}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Remove item"
                      onClick={() => removeLine(index)}
                      disabled={saving || lines.length === 1}
                      className="text-red-500 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={17} />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <Textarea
          label="Notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Delivery instructions or handover notes..."
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
