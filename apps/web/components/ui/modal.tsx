"use client";

import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

import { cn } from "@/lib/cn";

interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  className?: string;
}

export function Modal({
  open,
  title,
  description,
  children,
  footer,
  onClose,
  className,
}: ModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);

      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0 bg-slate-950/50"
        onClick={onClose}
      />

      <div
        className={cn(
          "relative z-10 w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl",
          className,
        )}
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2
              id="modal-title"
              className="text-xl font-semibold text-slate-900"
            >
              {title}
            </h2>

            {description ? (
              <p className="mt-1 text-sm text-slate-500">{description}</p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-6">{children}</div>

        {footer ? (
          <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
