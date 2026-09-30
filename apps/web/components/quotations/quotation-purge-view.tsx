"use client";

import { FormEvent, useState } from "react";
import { Shield } from "lucide-react";

import { Button, Input, Modal } from "@/components/ui";

export function QuotationPurgeView({
  open,
  trackingId,
  loading = false,
  error,
  onClose,
  onConfirm,
}: {
  open: boolean;
  trackingId: string;
  loading?: boolean;
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
    <Modal
      open={open}
      title="Identity Clearance Requested"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="quotation-purge" variant="danger" loading={loading}>
            Verify & Dropship Purge
          </Button>
        </>
      }
    >
      <form id="quotation-purge" onSubmit={submit} className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Shield className="size-4 text-rose-600" />
          Absolute purge
        </div>
        <p className="text-sm text-slate-600">
          You are executing an absolute purge operation on record tracking ID:{" "}
          <strong className="font-mono text-rose-700">{trackingId}</strong>. This cannot be rolled back.
        </p>
        <Input
          label="Enter Your Account Access Password:"
          type="password"
          value={password}
          autoComplete="off"
          placeholder="Verify password credentials..."
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      </form>
    </Modal>
  );
}
