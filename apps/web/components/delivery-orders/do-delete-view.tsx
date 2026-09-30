"use client";

import { Shield } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { Button, Input } from "@/components/ui";

interface DoDeleteViewProps {
  open: boolean;
  deliveryNumber: string;
  loading?: boolean;
  error?: string | null;
  onConfirm: (password: string) => void;
  onClose: () => void;
}

export function DoDeleteView({
  open,
  deliveryNumber,
  loading = false,
  error = null,
  onConfirm,
  onClose,
}: DoDeleteViewProps) {
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (!open) setPassword("");
  }, [open]);

  if (!open) return null;

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!password.trim()) return;
    onConfirm(password);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-slate-950/60" onClick={onClose} />
      <form onSubmit={submit} className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600">
            <Shield size={18} />
          </span>
          <div>
            <h2 className="text-lg font-bold text-red-600">Confirm Delete</h2>
            <p className="text-sm text-slate-500">Deleting: <b>{deliveryNumber}</b></p>
          </div>
        </div>
        <Input
          label="Admin Password"
          type="password"
          value={password}
          placeholder="Admin Password"
          onChange={(event) => setPassword(event.target.value)}
          autoFocus
        />
        <p className={`mt-2 text-[11px] text-red-600 ${error ? "" : "invisible"}`}>Incorrect Password</p>
        <Button type="submit" variant="danger" loading={loading} className="mt-3 w-full">
          Verify & Delete
        </Button>
      </form>
    </div>
  );
}
