"use client";

import { ArrowLeftRight } from "lucide-react";
import { useEffect } from "react";

import { Button } from "./button";

interface ReplacementConfirmViewProps {
  open: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ReplacementConfirmView({
  open,
  loading = false,
  onConfirm,
  onClose,
}: ReplacementConfirmViewProps) {
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
      aria-labelledby="replacement-confirm-title"
    >
      <button
        type="button"
        aria-label="Close replacement confirmation"
        className="absolute inset-0 bg-slate-950/60"
        onClick={loading ? undefined : onClose}
      />
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-white text-center shadow-2xl">
        <div className="bg-rose-50 px-6 py-5">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-rose-600">
            <ArrowLeftRight size={22} />
          </div>
          <h2
            id="replacement-confirm-title"
            className="text-sm font-bold text-rose-700"
          >
            Replacement Workflow
          </h2>
        </div>
        <div className="px-6 py-5">
          <p className="text-sm leading-6 text-slate-600">
            Mark the selected items as damaged, then open a non-billable
            delivery order for the replacement?
          </p>
          <div className="mt-5 grid gap-2">
            <Button variant="danger" loading={loading} onClick={onConfirm}>
              Mark as Damaged
            </Button>
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
