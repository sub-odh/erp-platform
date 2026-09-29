"use client";

import { Shield } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { Button } from "./button";
import { Input } from "./input";

interface SecureDeleteViewProps {
  open: boolean;
  itemName: string;
  loading?: boolean;
  error?: string | null;
  onConfirm: (password: string) => void;
  onClose: () => void;
}

export function SecureDeleteView({
  open,
  itemName,
  loading = false,
  error = null,
  onConfirm,
  onClose,
}: SecureDeleteViewProps) {
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (!open) {
      setPassword("");
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
    if (!password.trim() || loading) return;
    onConfirm(password);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="secure-delete-title"
    >
      <button
        type="button"
        aria-label="Close security check"
        className="absolute inset-0 bg-slate-950/60"
        onClick={loading ? undefined : onClose}
      />
      <form
        onSubmit={submit}
        className="relative z-10 w-full max-w-xs rounded-[18px] bg-white p-6 text-center shadow-2xl"
      >
        <div className="mb-3 text-red-600">
          <Shield className="mx-auto" size={42} />
        </div>
        <h2 id="secure-delete-title" className="text-sm font-bold text-slate-900">
          Security Check
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Delete <span className="font-semibold text-slate-800">{itemName}</span>?
        </p>
        <div className="mt-3 text-left">
          <Input
            type="password"
            name="admin_password"
            autoComplete="current-password"
            placeholder="Admin Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            className="text-center"
          />
        </div>
        {error ? (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        ) : null}
        <div className="mt-3 grid gap-2">
          <Button type="submit" variant="danger" loading={loading}>
            Confirm Delete
          </Button>
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
