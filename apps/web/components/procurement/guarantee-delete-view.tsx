"use client";

import { useEffect, useState, type FormEvent } from "react";

import { Button, Input } from "@/components/ui";
import { deleteGuarantee } from "@/lib/procurement";
import type { Guarantee } from "@/types/procurement";

interface GuaranteeDeleteViewProps {
  guarantee: Guarantee | null;
  onClose: () => void;
  onDeleted: () => void;
}

export function GuaranteeDeleteView({
  guarantee,
  onClose,
  onDeleted,
}: GuaranteeDeleteViewProps) {
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!guarantee) {
      setPassword("");
      setError(null);
    }
  }, [guarantee]);

  if (!guarantee) {
    return null;
  }

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (!guarantee || !password.trim() || saving) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await deleteGuarantee(guarantee.id, password);
      onDeleted();
      onClose();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete this guarantee.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guarantee-delete-title"
    >
      <button
        type="button"
        aria-label="Close delete check"
        className="absolute inset-0 bg-slate-950/60"
        onClick={saving ? undefined : onClose}
      />
      <form
        onSubmit={(event) => void submit(event)}
        className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl"
      >
        <h2 id="guarantee-delete-title" className="text-base font-bold text-red-700">
          Critical Sudo Verification
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Delete the {guarantee.guaranteeType} for {guarantee.clientName}. Enter
          the signed-in superadmin password.
        </p>
        {error ? (
          <p className="mt-3 rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}
        <div className="mt-3">
          <Input
            label="Superadmin Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoFocus
            required
          />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Abort
          </Button>
          <Button type="submit" loading={saving} disabled={password.trim().length === 0}>
            Confirm Purge
          </Button>
        </div>
      </form>
    </div>
  );
}
