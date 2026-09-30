"use client";

import { FormEvent, useState } from "react";

import { Button, Input } from "@/components/ui";

export function VoidBalanceView({
  open,
  deliveryNumber,
  loading,
  error,
  onClose,
  onConfirm,
}: {
  open: boolean;
  deliveryNumber: string;
  loading: boolean;
  error?: string;
  onClose: () => void;
  onConfirm: (password: string) => void;
}) {
  const [password, setPassword] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    onConfirm(password);
  }

  return (
    <div className={open ? "fixed inset-0 z-50 flex items-center justify-center p-4" : "hidden"} role="dialog" aria-modal="true">
      <button type="button" aria-label="Close modal" className="absolute inset-0 bg-slate-950/40" onClick={onClose} />
      <form onSubmit={submit} className="relative z-10 w-full max-w-sm rounded-3xl bg-white/80 p-8 text-center shadow-2xl backdrop-blur">
        <div className="mx-auto mb-3 grid size-14 place-items-center rounded-full bg-rose-50 text-xl text-rose-600">!</div>
        <h2 className="text-lg font-semibold">Void Balance?</h2>
        <p className="mb-4 text-sm text-slate-500">
          You are about to void the balance for <span className="font-semibold text-slate-900">#{deliveryNumber}</span>. This will remove it from outstanding totals.
        </p>
        <Input label="Confirm Your Password" type="password" value={password} placeholder="Enter your password" required onChange={(event) => setPassword(event.target.value)} />
        {error ? <p className="mt-2 text-sm text-rose-700">{error}</p> : null}
        <div className="mt-4 flex gap-2">
          <Button type="button" variant="secondary" className="w-full" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="danger" className="w-full" loading={loading}>Confirm Void</Button>
        </div>
      </form>
    </div>
  );
}
