"use client";

import { Trash2 } from "lucide-react";
import { useEffect } from "react";

import { Button } from "./button";

interface DeleteConfirmViewProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function DeleteConfirmView({
  open,
  title,
  description,
  confirmLabel = "Delete",
  loading = false,
  onConfirm,
  onClose,
}: DeleteConfirmViewProps) {
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape" && !loading) onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [loading, onClose, open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-confirm-title"
    >
      <button
        type="button"
        aria-label="Close delete confirmation"
        className="absolute inset-0 bg-slate-950/60"
        onClick={loading ? undefined : onClose}
      />
      <div className="relative z-10 w-full max-w-sm rounded-[18px] bg-white p-6 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
          <Trash2 size={28} />
        </div>
        <h2 id="delete-confirm-title" className="text-base font-bold text-slate-900">
          {title}
        </h2>
        <p className="mt-2 text-sm text-slate-500">{description}</p>
        <div className="mt-5 grid gap-2">
          <Button variant="danger" loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
