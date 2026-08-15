"use client";

import { useEffect, useState, type FormEvent } from "react";

import { Button, Input, Modal } from "@/components/ui";
import {
  createCategory,
  createUnit,
  updateCategory,
  updateUnit,
} from "@/lib/master-data";
import type { ProductCategory, ProductUnit } from "@/types/master-data";

type Props =
  | {
      kind: "category";
      open: boolean;
      record: ProductCategory | null;
      onClose: () => void;
      onSaved: () => void;
    }
  | {
      kind: "unit";
      open: boolean;
      record: ProductUnit | null;
      onClose: () => void;
      onSaved: () => void;
    };

export function SimpleMasterModal(props: Props) {
  const { kind, open, record, onClose, onSaved } = props;
  const [primary, setPrimary] = useState("");
  const [name, setName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setPrimary(
      record ? (kind === "category" ? record.code : record.symbol) : "",
    );
    setName(record?.name ?? "");
    setIsActive(record?.isActive ?? true);
  }, [kind, open, record]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!primary.trim() || !name.trim()) {
      setError(
        kind === "category"
          ? "Code and category name are required."
          : "Unit name and symbol are required.",
      );
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (kind === "category") {
        const input = { code: primary.trim(), name: name.trim(), isActive };
        if (record) await updateCategory(record.id, input);
        else await createCategory(input);
      } else {
        const input = { name: name.trim(), symbol: primary.trim(), isActive };
        if (record) await updateUnit(record.id, input);
        else await createUnit(input);
      }
      onSaved();
      onClose();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : `Unable to save ${kind}.`,
      );
    } finally {
      setSaving(false);
    }
  }

  const label = kind === "category" ? "Category" : "Unit";
  return (
    <Modal
      open={open}
      title={`${record ? "Edit" : "Add"} ${label}`}
      description={
        kind === "category"
          ? "Group related products for consistent reporting."
          : "Define how product quantities are measured."
      }
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="simple-master-form" loading={saving}>
            Save {label}
          </Button>
        </>
      }
    >
      <form id="simple-master-form" onSubmit={submit} className="space-y-5">
        {kind === "category" ? (
          <>
            <Input
              label="Category Code"
              placeholder="e.g. SERVER"
              value={primary}
              onChange={(event) => setPrimary(event.target.value)}
              required
            />
            <Input
              label="Category Name"
              placeholder="e.g. Servers"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </>
        ) : (
          <>
            <Input
              label="Unit Name"
              placeholder="e.g. Piece"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
            <Input
              label="Symbol"
              placeholder="e.g. pcs"
              value={primary}
              onChange={(event) => setPrimary(event.target.value)}
              required
            />
          </>
        )}
        <label className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(event) => setIsActive(event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-blue-600"
          />
          Active and available for new products
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
