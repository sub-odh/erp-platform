"use client";

import { Send } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { Button, Input, Textarea } from "@/components/ui";

interface PiDispatchViewProps {
  open: boolean;
  piNumber: string;
  loading?: boolean;
  error?: string | null;
  onSubmit: (input: {
    recipientEmail: string;
    emailSubject: string;
    emailBodyNotes: string;
  }) => void;
  onClose: () => void;
}

export function PiDispatchView({
  open,
  piNumber,
  loading = false,
  error = null,
  onSubmit,
  onClose,
}: PiDispatchViewProps) {
  const [recipientEmail, setRecipientEmail] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBodyNotes, setEmailBodyNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    setRecipientEmail("");
    setEmailSubject(`Official Purchase Order: ${piNumber}`);
    setEmailBodyNotes("");
  }, [open, piNumber]);

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

  function submit(event: FormEvent) {
    event.preventDefault();
    onSubmit({ recipientEmail, emailSubject, emailBodyNotes });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pi-dispatch-title"
    >
      <button
        type="button"
        aria-label="Close dispatch"
        className="absolute inset-0 bg-slate-950/60"
        onClick={loading ? undefined : onClose}
      />
      <form
        onSubmit={submit}
        className="relative z-10 w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3">
          <h2 id="pi-dispatch-title" className="flex items-center gap-2 text-base font-bold text-slate-900">
            <Send size={16} className="text-sky-600" />
            Dispatch Purchase Order
          </h2>
          <button type="button" aria-label="Close" onClick={onClose} disabled={loading}>
            ×
          </button>
        </div>
        <div className="space-y-3 px-4 py-4">
          <Input
            type="email"
            label="Recipient Email Address"
            required
            placeholder="client@example.com"
            value={recipientEmail}
            onChange={(event) => setRecipientEmail(event.target.value)}
          />
          <Input
            label="Email Subject"
            required
            value={emailSubject}
            onChange={(event) => setEmailSubject(event.target.value)}
          />
          <Textarea
            label="Message Body Notes"
            rows={3}
            placeholder="Please find attached the purchase order for your requested items..."
            value={emailBodyNotes}
            onChange={(event) => setEmailBodyNotes(event.target.value)}
          />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>
        <div className="flex justify-end gap-2 px-4 pb-4">
          <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" size="sm" loading={loading}>
            Send Dispatch
          </Button>
        </div>
      </form>
    </div>
  );
}
