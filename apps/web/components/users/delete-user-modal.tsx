"use client";

import { AlertTriangle, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Button, Modal } from "@/components/ui";
import { permanentlyDeleteUser } from "@/lib/users";
import type { User } from "@/types/user";

interface DeleteUserModalProps {
  open: boolean;
  user: User | null;
  onClose: () => void;
  onDeleted: (userId: string) => void;
}

export function DeleteUserModal({
  open,
  user,
  onClose,
  onDeleted,
}: DeleteUserModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setSubmitting(false);
      setError(null);
    }
  }, [open]);

  async function confirmDelete() {
    if (!user) return;
    setSubmitting(true);
    setError(null);
    try {
      await permanentlyDeleteUser(user.id);
      onDeleted(user.id);
      onClose();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to permanently delete user.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function close() {
    if (!submitting) onClose();
  }

  return (
    <Modal
      open={open}
      title="Delete User Permanently"
      description="This action cannot be undone."
      onClose={close}
      footer={
        <>
          <Button variant="outline" onClick={close} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={submitting}
            onClick={() => void confirmDelete()}
          >
            <Trash2 size={16} /> Delete User
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-4 rounded-xl border border-red-200 bg-red-50 p-4">
        <div className="rounded-lg bg-red-100 p-2 text-red-700">
          <AlertTriangle size={20} />
        </div>
        <div>
          <p className="font-medium text-red-900">
            Permanently delete{" "}
            {user ? `${user.firstName} ${user.lastName}` : "this user"}?
          </p>
          <p className="mt-1 text-sm leading-6 text-red-700">
            Their account and related login data will be permanently removed.
            This cannot be restored.
          </p>
        </div>
      </div>
      {error ? (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
    </Modal>
  );
}
