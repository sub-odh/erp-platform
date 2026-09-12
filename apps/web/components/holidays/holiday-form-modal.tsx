"use client";

import { type FormEvent, useEffect, useState } from "react";

import { Button, Input, Modal, Textarea } from "@/components/ui";
import { useCalendarSystem } from "@/lib/calendar-system";
import { formatCalendarDate } from "@/lib/nepali-date";
import type { Holiday, HolidayInput } from "@/types/holiday";

interface HolidayFormModalProps {
  open: boolean;
  holiday: Holiday | null;
  holidayDate: string;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (payload: HolidayInput) => Promise<void>;
  onDelete?: () => void;
}

export function HolidayFormModal({
  open,
  holiday,
  holidayDate,
  submitting,
  onClose,
  onSubmit,
  onDelete,
}: HolidayFormModalProps) {
  const { system } = useCalendarSystem();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    setTitle(holiday?.title ?? "");
    setDescription(holiday?.description ?? "");
  }, [holiday, open]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit({
      title: title.trim(),
      description: description.trim() || null,
      holidayDate,
    });
  }

  const editing = Boolean(holiday);

  return (
    <Modal
      open={open}
      title={editing ? "Edit Holiday" : "Mark Holiday"}
      description={formatCalendarDate(holidayDate, system)}
      onClose={onClose}
      className="max-w-md"
      footer={
        <>
          {editing && onDelete ? (
            <Button
              type="button"
              variant="danger"
              onClick={onDelete}
              disabled={submitting}
              className="mr-auto"
            >
              Delete
            </Button>
          ) : null}
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="holiday-form" loading={submitting}>
            Save Holiday
          </Button>
        </>
      }
    >
      <form id="holiday-form" onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
        <Input
          label="Holiday Title"
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="e.g. Public Holiday"
        />
        <Textarea
          label="Description"
          hint="Optional"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Brief note..."
          className="min-h-24"
        />
      </form>
    </Modal>
  );
}
