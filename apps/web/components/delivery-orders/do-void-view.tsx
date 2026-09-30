"use client";

import { Ban } from "lucide-react";

import { Button } from "@/components/ui";

interface DoVoidViewProps {
  open: boolean;
  deliveryNumber: string;
  loading?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onClose: () => void;
}

export function DoVoidView({
  open,
  deliveryNumber,
  loading = false,
  error = null,
  onConfirm,
  onClose,
}: DoVoidViewProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-slate-950/60" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-amber-700">
            <Ban size={18} />
          </span>
          <h2 className="text-lg font-bold text-slate-900">Void Delivery Order</h2>
        </div>
        <p className="text-sm text-slate-600">
          Are you sure you want to void this DO? This cannot be undone.
        </p>
        <p className="mt-1 text-xs text-slate-400">{deliveryNumber}</p>
        {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" loading={loading} onClick={onConfirm}>
            Void Order
          </Button>
        </div>
      </div>
    </div>
  );
}
