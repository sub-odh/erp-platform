"use client";

import { Archive } from "lucide-react";
import { useEffect, useState } from "react";

import { Button, Modal } from "@/components/ui";
import { archiveUser } from "@/lib/users";
import type { User } from "@/types/user";

interface ArchiveUserModalProps {
  open: boolean;
  user: User | null;
  onClose: () => void;
  onArchived: (userId: string) => void;
}

export function ArchiveUserModal({
  open,
  user,
  onClose,
  onArchived,
}: ArchiveUserModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setError(null);
      setSubmitting(false);
    }
  }, [open]);

  async function handleArchive(): Promise<void> {
    if (!user) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await archiveUser(user.id);
      onArchived(user.id);
      onClose();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to archive user",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose(): void {
    if (submitting) {
      return;
    }

    setError(null);
    onClose();
  }

  return (
    <Modal
      open={open}
      title="Archive user"
      description="The account will be removed from the active user list."
      onClose={handleClose}
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>

          <Button
            variant="danger"
            loading={submitting}
            onClick={() => void handleArchive()}
          >
            Archive user
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="flex items-start gap-4 rounded-xl bg-red-50 p-4">
          <div className="rounded-lg bg-red-100 p-2 text-red-700">
            <Archive size={20} />
          </div>

          <div>
            <p className="font-medium text-red-900">
              Archive{" "}
              {user ? `${user.firstName} ${user.lastName}` : "this user"}?
            </p>

            <p className="mt-1 text-sm leading-6 text-red-700">
              The account will be deactivated, all sessions will be revoked, and
              the user will no longer be able to sign in. Historical records
              will remain intact.
            </p>
          </div>
        </div>

        {error ? (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
