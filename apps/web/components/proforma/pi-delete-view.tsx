"use client";

import { Shield } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { Button, Input } from "@/components/ui";

interface PiDeleteViewProps {
  open: boolean;
  piNumber: string;
  loading?: boolean;
  error?: string | null;
  onConfirm: (password: string) => void;
  onClose: () => void;
}

export function PiDeleteView({
  open,
  piNumber,
  loading = false,
  error = null,
  onConfirm,
  onClose,
}: PiDeleteViewProps) {
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setPassword("");
      setLocalError(null);
      return;
    }
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

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!password.trim()) {
      setLocalError(
        "Verification sequence aborted: Password space must not be empty.",
      );
      return;
    }
    setLocalError(null);
    onConfirm(password);
  }

  const message = localError ?? error;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pi-delete-title"
    >
      <button
        type="button"
        aria-label="Close security check"
        className="absolute inset-0 bg-slate-950/60"
        onClick={loading ? undefined : onClose}
      />
      <form
        onSubmit={submit}
        className="relative z-10 w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between bg-red-600 px-4 py-3 text-white">
          <h2 id="pi-delete-title" className="flex items-center gap-2 text-base font-bold">
            <Shield size={18} />
            Security Authorization Verification Required
          </h2>
          <button
            type="button"
            aria-label="Close"
            className="text-white/90"
            onClick={onClose}
            disabled={loading}
          >
            ×
          </button>
        </div>
        <div className="space-y-3 px-4 py-4">
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
            <strong>Critical Warning:</strong> Purging will permanently delete
            data tracking dependencies corresponding to item mappings.
          </p>
          <p className="text-sm text-slate-800">
            You are attempting to delete proforma invoice:{" "}
            <strong className="text-blue-700">{piNumber}</strong>
          </p>
          <Input
            type="password"
            label="Confirm Your Account Password"
            value={password}
            autoComplete="current-password"
            placeholder="••••••••"
            onChange={(event) => setPassword(event.target.value)}
            disabled={loading}
          />
          {message ? <p className="text-sm text-red-600">{message}</p> : null}
        </div>
        <div className="flex justify-end gap-2 px-4 pb-4">
          <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={loading}>
            Abort Action
          </Button>
          <Button type="submit" variant="danger" size="sm" loading={loading}>
            Verify & Erase
          </Button>
        </div>
      </form>
    </div>
  );
}
