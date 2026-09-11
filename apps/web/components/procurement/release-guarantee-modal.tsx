"use client";

import { useEffect, useState, type FormEvent } from "react";

import { Button, Input, Modal, Textarea } from "@/components/ui";
import { useCalendarSystem } from "@/lib/calendar-system";
import { formatCalendarDate, toIsoDate } from "@/lib/nepali-date";
import { releaseGuarantee } from "@/lib/procurement";
import type { Guarantee } from "@/types/procurement";

const FORM_ID = "release-guarantee-form";

interface ReleaseGuaranteeModalProps {
  guarantee: Guarantee | null;
  onClose: () => void;
  onReleased: () => void;
}

export function ReleaseGuaranteeModal({
  guarantee,
  onClose,
  onReleased,
}: ReleaseGuaranteeModalProps) {
  const { system } = useCalendarSystem();

  const [releaseDate, setReleaseDate] = useState(() => toIsoDate(new Date()));
  const [releaseRemarks, setReleaseRemarks] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!guarantee) {
      return;
    }

    setReleaseDate(toIsoDate(new Date()));
    setReleaseRemarks("");
    setError(null);
  }, [guarantee]);

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (!guarantee) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await releaseGuarantee(guarantee.id, {
        releaseDate,
        releaseRemarks: releaseRemarks.trim() || null,
      });

      onReleased();
      onClose();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to release this guarantee.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={Boolean(guarantee)}
      title="Release Guarantee"
      description={
        guarantee
          ? `Close out the ${guarantee.guaranteeType} held for ${guarantee.clientName}.`
          : undefined
      }
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>

          <Button type="submit" form={FORM_ID} loading={saving}>
            Confirm Release
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
          label="Release Date"
          name="releaseDate"
          type="date"
          required
          value={releaseDate}
          onChange={(event) => setReleaseDate(event.target.value)}
          hint={
            system === "BS" ? formatCalendarDate(releaseDate, "BS") : undefined
          }
        />

        <Textarea
          label="Release Remarks"
          name="releaseRemarks"
          rows={3}
          maxLength={2000}
          value={releaseRemarks}
          onChange={(event) => setReleaseRemarks(event.target.value)}
          placeholder="Bank confirmation reference or handover note"
        />
      </form>
    </Modal>
  );
}
