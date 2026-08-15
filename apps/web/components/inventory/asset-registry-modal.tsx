"use client";

import { Save } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { Button, Input, Modal, Select, Textarea } from "@/components/ui";
import { createInventoryAsset, updateInventoryAsset } from "@/lib/inventory";
import type {
  InventoryAsset,
  InventoryAssetInput,
  InventoryAssetStatus,
} from "@/types/inventory";

interface Props {
  open: boolean;
  asset: InventoryAsset | null;
  onClose: () => void;
  onSaved: () => void;
}

interface FormState {
  itemName: string;
  category: string;
  purchaseDate: string;
  notes: string;
  purchasePrice: string;
  location: string;
  status: InventoryAssetStatus;
  assigned: boolean;
  assignedUserName: string;
  assignedUserContact: string;
  assignedDate: string;
  purpose: string;
}

const today = () => new Date().toISOString().slice(0, 10);

function emptyForm(): FormState {
  return {
    itemName: "",
    category: "",
    purchaseDate: today(),
    notes: "",
    purchasePrice: "",
    location: "",
    status: "AVAILABLE",
    assigned: false,
    assignedUserName: "",
    assignedUserContact: "",
    assignedDate: today(),
    purpose: "",
  };
}

function registryStatus(status: InventoryAssetStatus): InventoryAssetStatus {
  return ["AVAILABLE", "IN_USE", "POC_LOAN"].includes(status)
    ? status
    : "AVAILABLE";
}

export function AssetRegistryModal({ open, asset, onClose, onSaved }: Props) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(
      asset
        ? {
            itemName: asset.itemName,
            category: asset.category,
            purchaseDate: asset.purchaseDate ?? today(),
            notes: asset.notes ?? "",
            purchasePrice: String(asset.purchasePrice),
            location: asset.location ?? "",
            status: registryStatus(asset.status),
            assigned: Boolean(
              asset.assignedUserName ||
              asset.assignedUserContact ||
              asset.assignedDate ||
              asset.purpose,
            ),
            assignedUserName: asset.assignedUserName ?? "",
            assignedUserContact: asset.assignedUserContact ?? "",
            assignedDate: asset.assignedDate ?? today(),
            purpose: asset.purpose ?? "",
          }
        : emptyForm(),
    );
  }, [asset, open]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.itemName.trim() || !form.category.trim()) {
      setError("Asset name and category are required.");
      return;
    }

    const payload: InventoryAssetInput = {
      itemName: form.itemName.trim(),
      category: form.category.trim(),
      quantity: asset?.stockQuantity ?? 1,
      purchasePrice: Number(form.purchasePrice || 0),
      mrpPrice: asset?.mrpPrice ?? 0,
      status: form.status,
      purchaseDate: form.purchaseDate || undefined,
      notes: form.notes.trim() || undefined,
      location: form.location.trim() || undefined,
      assignedUserName: form.assigned ? form.assignedUserName.trim() : "",
      assignedUserContact: form.assigned ? form.assignedUserContact.trim() : "",
      assignedDate: form.assigned ? form.assignedDate || undefined : "",
      purpose: form.assigned ? form.purpose.trim() : "",
    };

    setSubmitting(true);
    setError(null);
    try {
      if (asset) await updateInventoryAsset(asset.id, payload);
      else await createInventoryAsset(payload);
      onSaved();
      onClose();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save asset.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      title={asset ? "Modify Asset" : "Register Asset"}
      onClose={onClose}
      className="max-w-4xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="asset-registry-form" loading={submitting}>
            <Save size={16} /> {asset ? "Update Inventory" : "Register Asset"}
          </Button>
        </>
      }
    >
      <form id="asset-registry-form" onSubmit={submit} className="space-y-5">
        <div className="grid gap-4 md:grid-cols-[1.5fr_0.72fr_0.72fr]">
          <Input
            label="Asset Name"
            required
            value={form.itemName}
            onChange={(event) => update("itemName", event.target.value)}
          />
          <Input
            label="Category"
            required
            value={form.category}
            onChange={(event) => update("category", event.target.value)}
          />
          <Input
            label="Purchase Date"
            type="date"
            value={form.purchaseDate}
            onChange={(event) => update("purchaseDate", event.target.value)}
          />
        </div>

        <Textarea
          label="Device / Item Details & Specs"
          rows={3}
          placeholder="S/N, configuration, hardware details..."
          value={form.notes}
          onChange={(event) => update("notes", event.target.value)}
        />

        <div className="grid gap-4 md:grid-cols-3">
          <Input
            label="Price (Rs.)"
            type="number"
            min="0"
            step="0.01"
            value={form.purchasePrice}
            onChange={(event) => update("purchasePrice", event.target.value)}
          />
          <Input
            label="Location"
            value={form.location}
            onChange={(event) => update("location", event.target.value)}
          />
          <Select
            label="Status"
            value={form.status}
            onChange={(event) =>
              update("status", event.target.value as InventoryAssetStatus)
            }
          >
            <option value="AVAILABLE">Available</option>
            <option value="IN_USE">In Use</option>
            <option value="POC_LOAN">PoC (Loan)</option>
          </Select>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={form.assigned}
          onClick={() => update("assigned", !form.assigned)}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-700"
        >
          <span
            className={`relative h-5 w-9 rounded-full transition ${form.assigned ? "bg-blue-600" : "bg-slate-300"}`}
          >
            <span
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${form.assigned ? "left-4.5" : "left-0.5"}`}
            />
          </span>
          Assigned Technical User
        </button>

        {form.assigned ? (
          <section className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Input
                label="Name"
                value={form.assignedUserName}
                onChange={(event) =>
                  update("assignedUserName", event.target.value)
                }
              />
              <Input
                label="Contact"
                value={form.assignedUserContact}
                onChange={(event) =>
                  update("assignedUserContact", event.target.value)
                }
              />
              <Input
                label="Assigned Date"
                type="date"
                value={form.assignedDate}
                onChange={(event) => update("assignedDate", event.target.value)}
              />
            </div>
            <div className="mt-4">
              <Input
                label="Purpose / Usage"
                value={form.purpose}
                onChange={(event) => update("purpose", event.target.value)}
              />
            </div>
          </section>
        ) : null}

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}
      </form>
    </Modal>
  );
}
