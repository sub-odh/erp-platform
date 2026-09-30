"use client";

import { FormEvent } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui";

export function CloudQuotationDeleteView({
  open,
  quotationNumber,
  loading = false,
  error,
  onClose,
  onConfirm,
}: {
  open: boolean;
  quotationNumber: string;
  loading?: boolean;
  error?: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;

  function submit(event: FormEvent) {
    event.preventDefault();
    onConfirm();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
        <div className="mb-3 flex items-center gap-2 text-rose-700">
          <Trash2 className="size-4" />
          <h2 className="text-base font-semibold">Delete Quotation</h2>
        </div>
        <p className="text-sm text-slate-600">
          Are you sure you want to permanently delete quotation #{quotationNumber}?
        </p>
        {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="danger" loading={loading}>
            Delete
          </Button>
        </div>
      </form>
    </div>
  );
}
