"use client";

import { useEffect, useState, type FormEvent } from "react";

import { Button, Input, Modal, Textarea } from "@/components/ui";
import { createVendor, updateVendor } from "@/lib/master-data";
import type { Vendor, VendorInput } from "@/types/master-data";

interface Props {
  open: boolean;
  vendor: Vendor | null;
  onClose: () => void;
  onSaved: () => void;
}

const emptyForm = {
  code: "",
  name: "",
  contactPerson: "",
  email: "",
  phone: "",
  taxNumber: "",
  address: "",
  paymentTermsDays: "0",
  notes: "",
  isActive: true,
};

export function VendorModal({ open, vendor, onClose, onSaved }: Props) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(
      vendor
        ? {
            code: vendor.code,
            name: vendor.name,
            contactPerson: vendor.contactPerson ?? "",
            email: vendor.email ?? "",
            phone: vendor.phone ?? "",
            taxNumber: vendor.taxNumber ?? "",
            address: vendor.address ?? "",
            paymentTermsDays: String(vendor.paymentTermsDays),
            notes: vendor.notes ?? "",
            isActive: vendor.isActive,
          }
        : emptyForm,
    );
  }, [open, vendor]);

  function update(key: keyof typeof emptyForm, value: string | boolean) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const paymentTermsDays = Number(form.paymentTermsDays || 0);
    if (!form.code.trim() || !form.name.trim()) {
      setError("Vendor code and name are required.");
      return;
    }
    if (!Number.isInteger(paymentTermsDays) || paymentTermsDays < 0) {
      setError("Payment terms must be a non-negative number of days.");
      return;
    }
    const input: VendorInput = {
      code: form.code.trim(),
      name: form.name.trim(),
      contactPerson: form.contactPerson.trim() || null,
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      taxNumber: form.taxNumber.trim() || null,
      address: form.address.trim() || null,
      paymentTermsDays,
      notes: form.notes.trim() || null,
      isActive: form.isActive,
    };
    setSaving(true);
    setError(null);
    try {
      if (vendor) await updateVendor(vendor.id, input);
      else await createVendor(input);
      onSaved();
      onClose();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save vendor.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      title={vendor ? "Edit Vendor" : "Register Vendor"}
      description="Store supplier contact and purchasing terms company-wide."
      className="max-w-3xl"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="vendor-form" loading={saving}>
            Save Vendor
          </Button>
        </>
      }
    >
      <form id="vendor-form" onSubmit={submit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Vendor Code"
            placeholder="e.g. VEN-001"
            value={form.code}
            onChange={(event) => update("code", event.target.value)}
            required
          />
          <Input
            label="Vendor Name"
            placeholder="e.g. Dell Nepal"
            value={form.name}
            onChange={(event) => update("name", event.target.value)}
            required
          />
          <Input
            label="Contact Person"
            value={form.contactPerson}
            onChange={(event) => update("contactPerson", event.target.value)}
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(event) => update("email", event.target.value)}
          />
          <Input
            label="Phone"
            value={form.phone}
            onChange={(event) => update("phone", event.target.value)}
          />
          <Input
            label="VAT / PAN Number"
            value={form.taxNumber}
            onChange={(event) => update("taxNumber", event.target.value)}
          />
          <Input
            label="Payment Terms (days)"
            type="number"
            min="0"
            step="1"
            value={form.paymentTermsDays}
            onChange={(event) => update("paymentTermsDays", event.target.value)}
          />
        </div>
        <Textarea
          label="Address"
          rows={2}
          value={form.address}
          onChange={(event) => update("address", event.target.value)}
        />
        <Textarea
          label="Notes"
          rows={2}
          value={form.notes}
          onChange={(event) => update("notes", event.target.value)}
        />
        <label className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(event) => update("isActive", event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-blue-600"
          />
          Active and available for purchasing
        </label>
        {error ? (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}
      </form>
    </Modal>
  );
}
