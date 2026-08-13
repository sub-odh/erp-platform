"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";

import { Button, Modal, Select, Textarea } from "@/components/ui";

import { changeOpportunityStage } from "@/lib/opportunities";

import type { Opportunity } from "@/types/opportunity";

import type { PipelineStage } from "@/types/pipeline-stage";

interface OpportunityStageModalProps {
  open: boolean;

  opportunity: Opportunity | null;

  stages: PipelineStage[];

  onClose: () => void;

  onSaved: (opportunity: Opportunity) => void;
}

export function OpportunityStageModal({
  open,
  opportunity,
  stages,
  onClose,
  onSaved,
}: OpportunityStageModalProps) {
  const [stageId, setStageId] = useState("");

  const [lossReason, setLossReason] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const activeStages = useMemo(
    () =>
      stages
        .filter((stage) => stage.isActive)
        .sort((a, b) => a.position - b.position),
    [stages],
  );

  const selectedStage = activeStages.find((stage) => stage.id === stageId);

  const isLostStage = Boolean(selectedStage?.isClosed && !selectedStage.isWon);

  useEffect(() => {
    if (!open || !opportunity) {
      return;
    }

    setStageId(opportunity.stageId);

    setLossReason(opportunity.lossReason ?? "");

    setError(null);
  }, [open, opportunity]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (!opportunity) {
      return;
    }

    if (!stageId) {
      setError("Select a pipeline stage.");

      return;
    }

    const normalizedLossReason = lossReason.trim();

    if (isLostStage && !normalizedLossReason) {
      setError("Loss reason is required when moving an opportunity to Lost.");

      return;
    }

    setSubmitting(true);

    setError(null);

    try {
      const saved = await changeOpportunityStage(opportunity.id, {
        stageId,

        lossReason: isLostStage ? normalizedLossReason : undefined,
      });

      onSaved(saved);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to change opportunity stage.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      title="Change opportunity stage"
      description={
        opportunity
          ? `Move "${opportunity.name}" to another sales stage.`
          : "Move this opportunity to another sales stage."
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
            form="opportunity-stage-form"
            loading={submitting}
          >
            Change Stage
          </Button>
        </>
      }
    >
      <form
        id="opportunity-stage-form"
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        <Select
          label="Pipeline stage"
          value={stageId}
          onChange={(event) => {
            setStageId(event.target.value);

            setLossReason("");
          }}
          required
        >
          {activeStages.map((stage) => (
            <option key={stage.id} value={stage.id}>
              {stage.name} — {stage.probability}%
            </option>
          ))}
        </Select>

        {selectedStage ? (
          <div
            className={[
              "rounded-lg border px-4 py-3 text-sm",
              selectedStage.isWon
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : selectedStage.isClosed
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-blue-200 bg-blue-50 text-blue-700",
            ].join(" ")}
          >
            {selectedStage.isWon
              ? "This will mark the opportunity as Won and close the deal."
              : selectedStage.isClosed
                ? "This will mark the opportunity as Lost and close the deal."
                : `The opportunity will remain Open with ${selectedStage.probability}% probability.`}
          </div>
        ) : null}

        {isLostStage ? (
          <Textarea
            label="Loss reason"
            value={lossReason}
            onChange={(event) => setLossReason(event.target.value)}
            rows={4}
            placeholder="Why was this deal lost?"
            required
          />
        ) : null}

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}
      </form>
    </Modal>
  );
}
