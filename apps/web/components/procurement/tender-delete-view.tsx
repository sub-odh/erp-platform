"use client";

import { Button } from "@/components/ui";

interface TenderDeleteViewProps {
  open: boolean;
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function TenderDeleteView({
  open,
  deleting,
  onClose,
  onConfirm,
}: TenderDeleteViewProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4">
      <div
        role="dialog"
        aria-labelledby="tender-delete-title"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm"
      >
        <h2 id="tender-delete-title" className="text-lg font-bold text-slate-900">
          Delete Tender?
        </h2>
        <p className="mt-2 text-sm text-slate-600">Permanent action.</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="danger" loading={deleting} onClick={onConfirm}>
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
