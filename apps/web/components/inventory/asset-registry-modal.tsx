"use client";

import { Save } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { Button, Input, Modal, Select, Textarea } from "@/components/ui";
import { officeFormStatus } from "@/lib/asset-office";
import { createOfficeAsset, updateOfficeAsset } from "@/lib/office-assets";
import type { OfficeAsset, OfficeAssetStatus } from "@/types/office-asset";

interface Props {
  open: boolean;
  asset: OfficeAsset | null;
  onClose: () => void;
  onSaved: () => void;
}

interface FormState {
  assetName: string;
  category: string;
  purchaseDate: string;
  itemDetails: string;
  purchasePrice: string;
  location: string;
  status: OfficeAssetStatus;
  assigned: boolean;
  techPersonName: string;
  techPersonContact: string;
  techUsedDate: string;
  techUsageDetails: string;
  pocCompanyName: string;
  pocClientName: string;
  pocPersonContact: string;
  pocStartDate: string;
  pocTakenTime: string;
  returnDeadline: string;
  returnTime: string;
}

function emptyForm(): FormState {
  return {
    assetName: "",
    category: "",
    purchaseDate: "",
    itemDetails: "",
    purchasePrice: "",
    location: "",
    status: "Available",
    assigned: false,
    techPersonName: "",
    techPersonContact: "",
    techUsedDate: "",
    techUsageDetails: "",
    pocCompanyName: "",
    pocClientName: "",
    pocPersonContact: "",
    pocStartDate: "",
    pocTakenTime: "",
    returnDeadline: "",
    returnTime: "",
  };
}

function blank(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

export function AssetRegistryModal({ open, asset, onClose, onSaved }: Props) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);

    if (!asset) {
      setForm(emptyForm());
      return;
    }

    setForm({
      assetName: asset.assetName,
      category: asset.category ?? "",
      purchaseDate: asset.purchaseDate ?? "",
      itemDetails: asset.itemDetails ?? "",
      purchasePrice:
        asset.purchasePrice === 0 ? "" : String(asset.purchasePrice),
      location: asset.currentLocation ?? "",
      status: officeFormStatus(asset.utilizationStatus),
      assigned: Boolean(asset.techPersonName?.trim()),
      techPersonName: asset.techPersonName ?? "",
      techPersonContact: asset.techPersonContact ?? "",
      techUsedDate: asset.techUsedDate ?? "",
      techUsageDetails: asset.techUsageDetails ?? "",
      pocCompanyName: asset.pocCompanyName ?? "",
      pocClientName: asset.pocClientName ?? "",
      pocPersonContact: asset.pocPersonContact ?? "",
      pocStartDate: asset.pocStartDate ?? "",
      pocTakenTime: asset.pocTakenTime ?? "",
      returnDeadline: asset.returnDeadline ?? "",
      returnTime: asset.returnTime ?? "",
    });
  }, [asset, open]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        assetName: form.assetName.trim() || "Unnamed Asset",
        category: blank(form.category),
        purchasePrice: Number(form.purchasePrice || 0),
        purchaseDate: blank(form.purchaseDate),
        itemDetails: blank(form.itemDetails),
        currentLocation: blank(form.location),
        utilizationStatus: form.status,
        techPersonName: blank(form.techPersonName),
        techPersonContact: blank(form.techPersonContact),
        techUsageDetails: blank(form.techUsageDetails),
        techUsedDate: blank(form.techUsedDate),
        pocCompanyName: blank(form.pocCompanyName),
        pocClientName: blank(form.pocClientName),
        pocPersonContact: blank(form.pocPersonContact),
        pocStartDate: blank(form.pocStartDate),
        pocTakenTime: blank(form.pocTakenTime),
        returnDeadline: blank(form.returnDeadline),
        returnTime: blank(form.returnTime),
      };

      if (asset) await updateOfficeAsset(asset.id, payload);
      else await createOfficeAsset(payload);
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
          <Button variant="outline" className="rounded-full px-5" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="asset-registry-form"
            loading={submitting}
            className="rounded-full px-6"
          >
            <Save size={16} /> Update Inventory
          </Button>
        </>
      }
    >
      <form id="asset-registry-form" onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-6">
          <div className="md:col-span-3">
            <Input
              label="Asset Name"
              required
              value={form.assetName}
              onChange={(event) => update("assetName", event.target.value)}
            />
          </div>
          <div className="md:col-span-1">
            <Input
              label="Category"
              value={form.category}
              onChange={(event) => update("category", event.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <Input
              label="Purchase Date"
              type="date"
              value={form.purchaseDate}
              onChange={(event) => update("purchaseDate", event.target.value)}
            />
          </div>
        </div>

        <Textarea
          label="Device / Item Details & Specs"
          rows={2}
          placeholder="S/N, configuration, hardware details..."
          value={form.itemDetails}
          onChange={(event) => update("itemDetails", event.target.value)}
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
              update("status", event.target.value as OfficeAssetStatus)
            }
          >
            <option value="Available">Available</option>
            <option value="In Use">In Use</option>
            <option value="PoC">PoC (Loan)</option>
          </Select>
        </div>

        <label className="inline-flex items-center gap-2 text-sm font-semibold text-[#1b2559]">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={form.assigned}
            onChange={(event) => update("assigned", event.target.checked)}
          />
          Assigned Technical User
        </label>

        {form.assigned ? (
          <section className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Input
                label="Name"
                value={form.techPersonName}
                onChange={(event) =>
                  update("techPersonName", event.target.value)
                }
              />
              <Input
                label="Contact"
                value={form.techPersonContact}
                onChange={(event) =>
                  update("techPersonContact", event.target.value)
                }
              />
              <Input
                label="Usage Date"
                type="date"
                value={form.techUsedDate}
                onChange={(event) => update("techUsedDate", event.target.value)}
              />
            </div>
            <div className="mt-4">
              <Input
                label="Purpose / Usage"
                value={form.techUsageDetails}
                onChange={(event) =>
                  update("techUsageDetails", event.target.value)
                }
              />
            </div>
          </section>
        ) : null}

        {form.status === "PoC" ? (
          <section className="rounded-2xl border border-red-200 bg-red-50/40 p-4">
            <div className="grid gap-4 md:grid-cols-6">
              <div className="md:col-span-3">
                <Input
                  label="Company Name"
                  value={form.pocCompanyName}
                  onChange={(event) =>
                    update("pocCompanyName", event.target.value)
                  }
                />
              </div>
              <div className="md:col-span-3">
                <Input
                  label="Receiver Person"
                  value={form.pocClientName}
                  onChange={(event) =>
                    update("pocClientName", event.target.value)
                  }
                />
              </div>
              <div className="md:col-span-3">
                <Input
                  label="Contact / Email"
                  value={form.pocPersonContact}
                  onChange={(event) =>
                    update("pocPersonContact", event.target.value)
                  }
                />
              </div>
              <div className="md:col-span-1">
                <Input
                  label="PoC Start Date"
                  type="date"
                  value={form.pocStartDate}
                  onChange={(event) =>
                    update("pocStartDate", event.target.value)
                  }
                />
              </div>
              <div className="md:col-span-2">
                <Input
                  label="Start Time"
                  type="time"
                  value={form.pocTakenTime}
                  onChange={(event) =>
                    update("pocTakenTime", event.target.value)
                  }
                />
              </div>
              <div className="md:col-span-3">
                <Input
                  label="Return Date"
                  type="date"
                  value={form.returnDeadline}
                  onChange={(event) =>
                    update("returnDeadline", event.target.value)
                  }
                />
              </div>
              <div className="md:col-span-3">
                <Input
                  label="Return Time"
                  type="time"
                  value={form.returnTime}
                  onChange={(event) => update("returnTime", event.target.value)}
                />
              </div>
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
