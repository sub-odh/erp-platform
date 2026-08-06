"use client";

import { Check, Copy, KeyRound } from "lucide-react";
import { useEffect, useState } from "react";

import { Button, Modal } from "@/components/ui";
import { resetUserPassword } from "@/lib/users";
import type { ResetUserPasswordResponse, User } from "@/types/user";

interface ResetUserPasswordModalProps {
  open: boolean;
  user: User | null;
  onClose: () => void;
}

export function ResetUserPasswordModal({
  open,
  user,
  onClose,
}: ResetUserPasswordModalProps) {
  const [result, setResult] = useState<ResetUserPasswordResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) {
      setResult(null);
      setError(null);
      setCopied(false);
      setSubmitting(false);
    }
  }, [open]);

  async function handleReset(): Promise<void> {
    if (!user) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await resetUserPassword(user.id);
      setResult(response);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to reset password",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCopy(): Promise<void> {
    if (!result) {
      return;
    }

    try {
      await navigator.clipboard.writeText(result.temporaryPassword);

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setError("Unable to copy the temporary password.");
    }
  }

  function handleClose(): void {
    if (submitting) {
      return;
    }

    setResult(null);
    setError(null);
    setCopied(false);
    onClose();
  }

  return (
    <Modal
      open={open}
      title={result ? "Temporary password created" : "Reset user password"}
      description={
        result
          ? "Copy this password now. It will not be shown again."
          : `Generate a temporary password for ${
              user ? `${user.firstName} ${user.lastName}` : "this user"
            }.`
      }
      onClose={handleClose}
      footer={
        result ? (
          <Button onClick={handleClose}>Done</Button>
        ) : (
          <>
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={submitting}
            >
              Cancel
            </Button>

            <Button
              variant="danger"
              loading={submitting}
              onClick={() => void handleReset()}
            >
              Reset password
            </Button>
          </>
        )
      }
    >
      {result ? (
        <div className="space-y-5">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-900">
              This password is displayed once
            </p>

            <p className="mt-1 text-sm text-amber-700">
              The user must change it after signing in. Existing sessions have
              been revoked.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Temporary password
            </label>

            <div className="flex items-center gap-2">
              <code className="min-w-0 flex-1 overflow-x-auto rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 font-mono text-sm text-slate-900">
                {result.temporaryPassword}
              </code>

              <Button
                variant="outline"
                size="icon"
                aria-label="Copy temporary password"
                onClick={() => void handleCopy()}
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </Button>
            </div>
          </div>

          {copied ? (
            <p className="text-sm text-emerald-700">Password copied.</p>
          ) : null}
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex items-start gap-4 rounded-xl bg-slate-50 p-4">
            <div className="rounded-lg bg-blue-100 p-2 text-blue-700">
              <KeyRound size={20} />
            </div>

            <div>
              <p className="font-medium text-slate-900">
                Generate a temporary password
              </p>

              <p className="mt-1 text-sm leading-6 text-slate-600">
                This will invalidate the user&apos;s current access and refresh
                tokens.
              </p>
            </div>
          </div>

          {error ? (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}
        </div>
      )}
    </Modal>
  );
}
