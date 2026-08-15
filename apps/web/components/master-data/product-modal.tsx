"use client";

import { useEffect, useState, type FormEvent } from "react";

import { Button, Input, Modal, Select, Textarea } from "@/components/ui";
import { createProduct, updateProduct } from "@/lib/master-data";
import type {
  MasterDataOptions,
  Product,
  ProductInput,
} from "@/types/master-data";

interface Props {
  open: boolean;
  product: Product | null;
  options: MasterDataOptions;
  onClose: () => void;
  onSaved: () => void;
}

const emptyForm = {
  sku: "",
  name: "",
  categoryId: "",
  unitId: "",
  defaultVendorId: "",
  description: "",
  purchasePrice: "0",
  sellingPrice: "0",
  reorderLevel: "0",
  isActive: true,
};

export function ProductModal({
  open,
  product,
  options,
  onClose,
  onSaved,
}: Props) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(
      product
        ? {
            sku: product.sku,
            name: product.name,
            categoryId: product.categoryId,
            unitId: product.unitId,
            defaultVendorId: product.defaultVendorId ?? "",
            description: product.description ?? "",
            purchasePrice: String(product.purchasePrice),
            sellingPrice: String(product.sellingPrice),
            reorderLevel: String(product.reorderLevel),
            isActive: product.isActive,
          }
        : {
            ...emptyForm,
            categoryId: options.categories[0]?.id ?? "",
            unitId: options.units[0]?.id ?? "",
          },
    );
  }, [open, options, product]);

  function update(key: keyof typeof emptyForm, value: string | boolean) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.sku.trim() || !form.name.trim()) {
      setError("SKU and product name are required.");
      return;
    }
    if (!form.categoryId || !form.unitId) {
      setError("Create an active category and unit before saving a product.");
      return;
    }
    const input: ProductInput = {
      sku: form.sku.trim(),
      name: form.name.trim(),
      categoryId: form.categoryId,
      unitId: form.unitId,
      defaultVendorId: form.defaultVendorId || null,
      description: form.description.trim() || null,
      purchasePrice: Number(form.purchasePrice || 0),
      sellingPrice: Number(form.sellingPrice || 0),
      reorderLevel: Number(form.reorderLevel || 0),
      isActive: form.isActive,
    };
    if (
      input.purchasePrice < 0 ||
      input.sellingPrice < 0 ||
      !Number.isInteger(input.reorderLevel) ||
      input.reorderLevel < 0
    ) {
      setError("Prices and reorder level cannot be negative.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (product) await updateProduct(product.id, input);
      else await createProduct(input);
      onSaved();
      onClose();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save product.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      title={product ? "Edit Product" : "Register Product"}
      description="Maintain a reusable catalog for inventory and purchasing."
      className="max-w-3xl"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="product-form" loading={saving}>
            Save Product
          </Button>
        </>
      }
    >
      <form id="product-form" onSubmit={submit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="SKU"
            placeholder="e.g. SRV-R740"
            value={form.sku}
            onChange={(event) => update("sku", event.target.value)}
            required
          />
          <Input
            label="Product Name"
            placeholder="e.g. Dell PowerEdge R740"
            value={form.name}
            onChange={(event) => update("name", event.target.value)}
            required
          />
          <Select
            label="Category"
            value={form.categoryId}
            onChange={(event) => update("categoryId", event.target.value)}
            required
          >
            <option value="">Select category</option>
            {options.categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.code} · {category.name}
              </option>
            ))}
          </Select>
          <Select
            label="Unit"
            value={form.unitId}
            onChange={(event) => update("unitId", event.target.value)}
            required
          >
            <option value="">Select unit</option>
            {options.units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.name} ({unit.symbol})
              </option>
            ))}
          </Select>
          <Select
            label="Default Vendor"
            value={form.defaultVendorId}
            onChange={(event) => update("defaultVendorId", event.target.value)}
          >
            <option value="">No default vendor</option>
            {options.vendors.map((vendor) => (
              <option key={vendor.id} value={vendor.id}>
                {vendor.code} · {vendor.name}
              </option>
            ))}
          </Select>
          <Input
            label="Reorder Level"
            type="number"
            min="0"
            step="1"
            value={form.reorderLevel}
            onChange={(event) => update("reorderLevel", event.target.value)}
          />
          <Input
            label="Purchase Price (Rs.)"
            type="number"
            min="0"
            step="0.01"
            value={form.purchasePrice}
            onChange={(event) => update("purchasePrice", event.target.value)}
          />
          <Input
            label="Selling Price (Rs.)"
            type="number"
            min="0"
            step="0.01"
            value={form.sellingPrice}
            onChange={(event) => update("sellingPrice", event.target.value)}
          />
        </div>
        <Textarea
          label="Description"
          rows={3}
          value={form.description}
          onChange={(event) => update("description", event.target.value)}
        />
        <label className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(event) => update("isActive", event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-blue-600"
          />
          Active and available in operational documents
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
