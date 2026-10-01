"use client";

import { useEffect, useState, type FormEvent } from "react";

import { TenderDeleteView } from "@/components/procurement/tender-delete-view";
import { Button, Input, Modal, Textarea } from "@/components/ui";
import { useCalendarSystem } from "@/lib/calendar-system";
import { formatCalendarDate } from "@/lib/nepali-date";
import { createTender, deleteTender, updateTender } from "@/lib/procurement";
import type { Tender } from "@/types/procurement";

const FORM_ID = "schedule-tender-form";

interface ScheduleTenderModalProps {
  open: boolean;
  /* Pre-selected day when the user clicks an empty calendar cell. */
  defaultDate: string;
  tender: Tender | null;
  onClose: () => void;
  onSaved: (message: string) => void;
}

export function ScheduleTenderModal({
  open,
  defaultDate,
  tender,
  onClose,
  onSaved,
}: ScheduleTenderModalProps) {
  const { system } = useCalendarSystem();

  const [title, setTitle] = useState("");
  const [submissionDate, setSubmissionDate] = useState(defaultDate);
  const [closingDate, setClosingDate] = useState("");
  const [details, setDetails] = useState("");
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    setTitle(tender?.title ?? "");
    setSubmissionDate(tender?.submissionDate ?? defaultDate);
    setClosingDate(tender?.closingDate ?? "");
    setDetails(tender?.details ?? "");
    setConfirmDelete(false);
    setError(null);
  }, [open, tender, defaultDate]);

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      title: title.trim(),
      submissionDate,
      closingDate: closingDate || null,
      details: details.trim() || null,
    };

    try {
      if (tender) {
        await updateTender(tender.id, payload);
      } else {
        await createTender(payload);
      }

      onSaved(tender ? "Tender Updated!" : "Tender Scheduled!");
      onClose();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save this tender.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function remove(): Promise<void> {
    if (!tender) {
      return;
    }

    setRemoving(true);
    setError(null);

    try {
      await deleteTender(tender.id);
      onSaved("Tender Deleted!");
      onClose();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to remove this tender.",
      );
    } finally {
      setRemoving(false);
    }
  }

  return (
    <Modal
      open={open}
      title={tender ? "Edit Tender" : "Schedule Tender"}
      description={
        tender
          ? "Update the deadline or details for this tender."
          : "Add a tender deadline to the procurement calendar."
      }
      onClose={onClose}
      footer={
        <>
          {tender ? (
            <Button
              variant="outline"
              onClick={() => setConfirmDelete(true)}
              className="mr-auto border-red-300 text-red-600"
            >
              Delete
            </Button>
          ) : null}

          <Button type="submit" form={FORM_ID} loading={saving} className="flex-1">
            {tender ? "Update Tender" : "Confirm Schedule"}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={submit} className="space-y-4">
        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <Input
          label="Tender Title"
          name="title"
          required
          maxLength={255}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Nepal Telecom - Firewall renewal"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Submission Date"
            name="submissionDate"
            type="date"
            required
            value={submissionDate}
            onChange={(event) => setSubmissionDate(event.target.value)}
            hint={
              system === "BS"
                ? formatCalendarDate(submissionDate, "BS")
                : undefined
            }
          />

          <div>
            <Input
              label="Closing Date"
              name="closingDate"
              type="date"
              value={closingDate}
              onChange={(event) => setClosingDate(event.target.value)}
              hint={
                system === "BS" && closingDate
                  ? formatCalendarDate(closingDate, "BS")
                  : undefined
              }
            />
            {tender ? <ClosingCountdown closingDate={closingDate} /> : null}
          </div>
        </div>

        <Textarea
          label="Details"
          name="details"
          rows={3}
          maxLength={5000}
          value={details}
          onChange={(event) => setDetails(event.target.value)}
          placeholder="Scope, client or submission notes"
        />
      </form>
      <TenderDeleteView
        open={confirmDelete}
        deleting={removing}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => void remove()}
      />
    </Modal>
  );
}

function ClosingCountdown({ closingDate }: { closingDate: string }) {
  if (!closingDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const closing = new Date(`${closingDate}T00:00:00`);
  const diffDays = Math.ceil((closing.getTime() - today.getTime()) / 86400000);
  const ended = diffDays < 0;
  const label =
    diffDays > 0 ? `${diffDays} days left` : diffDays === 0 ? "Closes Today!" : "Ended";

  return (
    <p
      className={
        ended
          ? "mt-2 inline-block rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-800"
          : "mt-2 inline-block rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800"
      }
    >
      {label}
    </p>
  );
}
