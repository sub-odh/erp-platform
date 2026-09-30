"use client";

import { Button, Modal } from "@/components/ui";

export function ReminderConfirmView({
  open,
  deliveryNumber,
  loading,
  onClose,
  onConfirm,
}: {
  open: boolean;
  deliveryNumber: string;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      open={open}
      title="Send Recovery Notice"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="button" loading={loading} onClick={onConfirm}>Send Notice</Button>
        </>
      }
    >
      <p className="text-sm text-slate-600">
        Dispatch manual recovery reminder notification ledger query for Delivery Order #{deliveryNumber}?
      </p>
    </Modal>
  );
}
