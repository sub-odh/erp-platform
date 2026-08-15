"use client";

import { Download, FileSpreadsheet, Upload } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { Button, Input, Modal, Select, Textarea } from "@/components/ui";
import {
  createInventoryAsset,
  downloadTextFile,
  getInventorySampleCsv,
  importInventoryCsv,
  updateInventoryAsset,
} from "@/lib/inventory";
import type {
  InventoryAsset,
  InventoryAssetInput,
  InventoryAssetStatus,
} from "@/types/inventory";

interface Props {
  open: boolean;
  asset?: InventoryAsset | null;
  onClose: () => void;
  onSaved: () => void;
}

interface FormState {
  itemName: string;
  category: string;
  vendor: string;
  modelNumber: string;
  serialNumber: string;
  purchaseSource: string;
  quantity: string;
  soldQuantity: string;
  damagedQuantity: string;
  purchasePrice: string;
  mrpPrice: string;
  status: InventoryAssetStatus;
  notes: string;
}

const emptyForm: FormState = {
  itemName: "",
  category: "",
  vendor: "",
  modelNumber: "",
  serialNumber: "",
  purchaseSource: "",
  quantity: "1",
  soldQuantity: "0",
  damagedQuantity: "0",
  purchasePrice: "",
  mrpPrice: "",
  status: "IN_STOCK",
  notes: "",
};

export function InventoryAssetModal({ open, asset, onClose, onSaved }: Props) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setFile(null);
    setForm(
      asset
        ? {
            itemName: asset.itemName,
            category: asset.category,
            vendor: asset.vendor ?? "",
            modelNumber: asset.modelNumber ?? "",
            serialNumber: asset.serialNumber ?? "",
            purchaseSource: asset.purchaseSource ?? "",
            quantity: String(asset.stockQuantity),
            soldQuantity: String(asset.soldQuantity),
            damagedQuantity: String(asset.damagedQuantity),
            purchasePrice: String(asset.purchasePrice),
            mrpPrice: String(asset.mrpPrice),
            status: asset.status,
            notes: asset.notes ?? "",
          }
        : emptyForm,
    );
  }, [asset, open]);

  function update(key: keyof FormState, value: string): void {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const quantity = Number(form.quantity);
    const purchasePrice = Number(form.purchasePrice || 0);
    const mrpPrice = Number(form.mrpPrice || 0);
    if (!form.itemName.trim() || !form.category.trim()) {
      setError("Item name and category are required.");
      return;
    }
    if (!Number.isInteger(quantity) || quantity < (asset ? 0 : 1)) {
      setError(
        asset ? "Quantity cannot be negative." : "Quantity must be at least 1.",
      );
      return;
    }
    const payload: InventoryAssetInput = {
      itemName: form.itemName.trim(),
      category: form.category.trim(),
      vendor: form.vendor.trim() || undefined,
      modelNumber: form.modelNumber.trim() || undefined,
      serialNumber: form.serialNumber.trim() || undefined,
      purchaseSource: form.purchaseSource.trim() || undefined,
      quantity,
      purchasePrice,
      mrpPrice,
      status: form.status,
      notes: form.notes.trim() || undefined,
    };
    if (asset) {
      payload.soldQuantity = Number(form.soldQuantity);
      payload.damagedQuantity = Number(form.damagedQuantity);
    }
    setSubmitting(true);
    try {
      if (asset) await updateInventoryAsset(asset.id, payload);
      else await createInventoryAsset(payload);
      onSaved();
      onClose();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : `Unable to ${asset ? "update" : "register"} the asset.`,
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleImport(): Promise<void> {
    if (!file) {
      setError("Choose a CSV file to import.");
      return;
    }
    setImporting(true);
    setError(null);
    try {
      await importInventoryCsv(file);
      onSaved();
      onClose();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to import CSV.",
      );
    } finally {
      setImporting(false);
    }
  }

  return (
    <Modal
      open={open}
      title={asset ? "Edit Asset" : "Register Asset"}
      onClose={onClose}
      className={asset ? "max-w-3xl" : "max-w-5xl"}
      footer={
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className={asset ? "" : "grid gap-7 md:grid-cols-[1.35fr_0.9fr]"}>
        <form
          id="inventory-asset-form"
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            {asset ? "Asset details" : "Manual entry"}
          </p>
          <Input
            label="Item Name"
            placeholder="e.g. Dell PowerEdge R740"
            value={form.itemName}
            onChange={(event) => update("itemName", event.target.value)}
            required
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Category"
              placeholder="e.g. Server"
              value={form.category}
              onChange={(event) => update("category", event.target.value)}
              required
            />
            <Input
              label="Vendor"
              placeholder="e.g. Dell"
              value={form.vendor}
              onChange={(event) => update("vendor", event.target.value)}
            />
            <Input
              label="Model No"
              value={form.modelNumber}
              onChange={(event) => update("modelNumber", event.target.value)}
            />
            <Input
              label="Serial No"
              value={form.serialNumber}
              onChange={(event) => update("serialNumber", event.target.value)}
            />
          </div>
          <Input
            label="Purchase Source"
            value={form.purchaseSource}
            onChange={(event) => update("purchaseSource", event.target.value)}
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label="Qty"
              type="number"
              min={asset ? 0 : 1}
              value={form.quantity}
              onChange={(event) => update("quantity", event.target.value)}
              required
            />
            <Input
              label="Cost (Rs.)"
              type="number"
              min="0"
              step="0.01"
              value={form.purchasePrice}
              onChange={(event) => update("purchasePrice", event.target.value)}
            />
            <Input
              label="MRP (Rs.)"
              type="number"
              min="0"
              step="0.01"
              value={form.mrpPrice}
              onChange={(event) => update("mrpPrice", event.target.value)}
            />
          </div>
          {asset ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                label="Sold"
                type="number"
                min="0"
                value={form.soldQuantity}
                onChange={(event) => update("soldQuantity", event.target.value)}
              />
              <Input
                label="Damaged"
                type="number"
                min="0"
                value={form.damagedQuantity}
                onChange={(event) =>
                  update("damagedQuantity", event.target.value)
                }
              />
              <Select
                label="Status"
                value={form.status}
                onChange={(event) => update("status", event.target.value)}
              >
                <option value="IN_STOCK">In Stock</option>
                <option value="SOLD">Sold</option>
                <option value="OUT_OF_STOCK">Out of Stock</option>
                <option value="DELIVERED">Delivered</option>
                <option value="DAMAGED">Damaged</option>
                <option value="RETURNED">Returned</option>
                <option value="RMA">RMA</option>
              </Select>
            </div>
          ) : null}
          {asset ? (
            <Textarea
              label="Notes"
              rows={2}
              value={form.notes}
              onChange={(event) => update("notes", event.target.value)}
            />
          ) : null}
          <Button
            type="submit"
            loading={submitting}
            className="w-full rounded-full"
          >
            {asset ? "Save Changes" : "Save Single Asset"}
          </Button>
        </form>

        {!asset ? (
          <section className="min-w-0 border-t border-slate-200 pt-6 md:border-l md:border-t-0 md:pl-7 md:pt-0">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Bulk import
            </p>
            <div className="mt-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-5 text-center">
              <FileSpreadsheet className="mx-auto text-slate-700" size={48} />
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Upload CSV file to import multiple assets at once.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 whitespace-nowrap rounded-full border-blue-500 text-blue-600"
                onClick={async () =>
                  downloadTextFile(await getInventorySampleCsv())
                }
              >
                <Download size={16} /> Sample CSV
              </Button>
              <label className="mt-4 flex min-w-0 cursor-pointer items-center overflow-hidden rounded-lg border border-slate-300 bg-white text-left text-sm text-slate-500">
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                  className="sr-only"
                />
                <span className="shrink-0 border-r border-slate-300 bg-slate-100 px-3 py-2.5 font-medium text-slate-700">
                  Choose File
                </span>
                <span className="min-w-0 truncate px-3">
                  {file?.name ?? "No file chosen"}
                </span>
              </label>
              <Button
                variant="secondary"
                className="mt-4 w-full whitespace-nowrap rounded-full"
                loading={importing}
                onClick={() => void handleImport()}
              >
                <Upload size={16} /> Upload & Import
              </Button>
            </div>
          </section>
        ) : null}
      </div>
      {error ? (
        <div className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
    </Modal>
  );
}
