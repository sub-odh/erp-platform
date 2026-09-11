"use client";

import { useEffect, useState, type FormEvent } from "react";

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
  onSaved: () => void;
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    setTitle(tender?.title ?? "");
    setSubmissionDate(tender?.submissionDate ?? defaultDate);
    setClosingDate(tender?.closingDate ?? "");
    setDetails(tender?.details ?? "");
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

      onSaved();
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
      onSaved();
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
              variant="danger"
              onClick={() => void remove()}
              loading={removing}
              className="mr-auto"
            >
              Delete
            </Button>
          ) : null}

          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>

          <Button type="submit" form={FORM_ID} loading={saving}>
            {tender ? "Save Changes" : "Confirm Schedule"}
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
    </Modal>
  );
}
