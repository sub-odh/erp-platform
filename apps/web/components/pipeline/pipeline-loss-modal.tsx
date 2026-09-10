"use client";

import { useEffect, useState, type FormEvent } from "react";

import { Button, Modal, Textarea } from "@/components/ui";

import { changeOpportunityStage } from "@/lib/opportunities";

import type { Opportunity } from "@/types/opportunity";
import type { PipelineStage } from "@/types/pipeline-stage";

interface PipelineLossModalProps {
  open: boolean;

  opportunity: Opportunity | null;

  stage: PipelineStage | null;

  onClose: () => void;

  onSaved: (opportunity: Opportunity) => void;
}

export function PipelineLossModal({
  open,
  opportunity,
  stage,
  onClose,
  onSaved,
}: PipelineLossModalProps) {
  const [lossReason, setLossReason] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    setLossReason(opportunity?.lossReason ?? "");

    setError(null);
  }, [open, opportunity]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (!opportunity || !stage) {
      return;
    }

    const normalizedReason = lossReason.trim();

    if (!normalizedReason) {
      setError("Loss reason is required.");

      return;
    }

    setSubmitting(true);

    setError(null);

    try {
      const saved = await changeOpportunityStage(opportunity.id, {
        stageId: stage.id,

        lossReason: normalizedReason,
      });

      onSaved(saved);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to move opportunity to Lost.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      title="Mark opportunity as lost"
      description={
        opportunity
          ? `Move "${opportunity.name}" to ${stage?.name ?? "Lost"} and close the deal.`
          : "Close this opportunity as lost."
      }
      onClose={onClose}
      className="max-w-lg"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            disabled={submitting}
            onClick={onClose}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            form="pipeline-loss-form"
            variant="danger"
            loading={submitting}
          >
            Mark as Lost
          </Button>
        </>
      }
    >
      <form
        id="pipeline-loss-form"
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          This will close the opportunity as Lost and set its probability to 0%.
        </div>

        <Textarea
          label="Loss Reason"
          value={lossReason}
          onChange={(event) => setLossReason(event.target.value)}
          rows={4}
          maxLength={500}
          placeholder="Why was this deal lost?"
          required
        />

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}
      </form>
    </Modal>
  );
}
