"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";

import { Button, Input, Modal, Select, Textarea } from "@/components/ui";

import { createOpportunity, updateOpportunity } from "@/lib/opportunities";

import type { Customer } from "@/types/customer";
import type { Lead } from "@/types/lead";
import type {
  CreateOpportunityRequest,
  Opportunity,
  UpdateOpportunityRequest,
} from "@/types/opportunity";
import type { PipelineStage } from "@/types/pipeline-stage";
import type { User } from "@/types/user";

interface OpportunityModalProps {
  open: boolean;

  opportunity?: Opportunity | null;

  stages: PipelineStage[];

  customers: Customer[];

  leads: Lead[];

  users: User[];

  onClose: () => void;

  onSaved: (opportunity: Opportunity) => void;
}

interface FormState {
  name: string;

  customerId: string;

  leadId: string;

  stageId: string;

  ownerUserId: string;

  amount: string;

  probability: string;

  expectedCloseDate: string;

  description: string;
}

const EMPTY_FORM: FormState = {
  name: "",

  customerId: "",

  leadId: "",

  stageId: "",

  ownerUserId: "",

  amount: "0",

  probability: "0",

  expectedCloseDate: "",

  description: "",
};

export function OpportunityModal({
  open,
  opportunity,
  stages,
  customers,
  leads,
  users,
  onClose,
  onSaved,
}: OpportunityModalProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const openStages = useMemo(
    () =>
      stages
        .filter((stage) => stage.isActive && !stage.isClosed)
        .sort((a, b) => a.position - b.position),
    [stages],
  );

  const activeCustomers = useMemo(
    () =>
      customers
        .filter((customer) => customer.isActive)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [customers],
  );

  const activeUsers = useMemo(
    () =>
      users
        .filter((user) => user.isActive && !user.deletedAt)
        .sort((a, b) => {
          const left = `${a.firstName} ${a.lastName}`;

          const right = `${b.firstName} ${b.lastName}`;

          return left.localeCompare(right);
        }),
    [users],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    if (opportunity) {
      setForm({
        name: opportunity.name,

        customerId: opportunity.customerId ?? "",

        leadId: opportunity.leadId ?? "",

        stageId: opportunity.stageId,

        ownerUserId: opportunity.ownerUserId ?? "",

        amount: opportunity.amount,

        probability: String(opportunity.probability),

        expectedCloseDate: opportunity.expectedCloseDate ?? "",

        description: opportunity.description ?? "",
      });
    } else {
      const defaultStage = openStages[0];

      setForm({
        ...EMPTY_FORM,

        stageId: defaultStage?.id ?? "",

        probability: String(defaultStage?.probability ?? 0),
      });
    }

    setError(null);
  }, [open, opportunity, openStages]);

  const currentStage = stages.find(
    (stage) => stage.id === opportunity?.stageId,
  );

  function updateField(key: keyof FormState, value: string): void {
    setForm((current) => ({
      ...current,

      [key]: value,
    }));
  }

  function handleStageChange(stageId: string): void {
    const stage = openStages.find((item) => item.id === stageId);

    setForm((current) => ({
      ...current,

      stageId,

      probability: String(stage?.probability ?? 0),
    }));
  }

  function optional(value: string): string | undefined {
    const normalized = value.trim();

    return normalized || undefined;
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    const name = form.name.trim();

    if (!name) {
      setError("Opportunity name is required.");

      return;
    }

    const amount = Number(form.amount || 0);

    if (!Number.isFinite(amount) || amount < 0) {
      setError("Deal value must be zero or greater.");

      return;
    }

    const probability = Number(form.probability || 0);

    if (
      !Number.isInteger(probability) ||
      probability < 0 ||
      probability > 100
    ) {
      setError("Probability must be a whole number between 0 and 100.");

      return;
    }

    if (!opportunity && !form.stageId) {
      setError("Pipeline stage is required.");

      return;
    }

    setSubmitting(true);

    setError(null);

    try {
      let saved: Opportunity;

      if (opportunity) {
        const payload: UpdateOpportunityRequest = {
          name,

          amount,

          probability,

          description: form.description,
        };

        if (form.customerId && form.customerId !== opportunity.customerId) {
          payload.customerId = form.customerId;
        }

        if (form.leadId && form.leadId !== opportunity.leadId) {
          payload.leadId = form.leadId;
        }

        if (form.ownerUserId && form.ownerUserId !== opportunity.ownerUserId) {
          payload.ownerUserId = form.ownerUserId;
        }

        if (form.expectedCloseDate) {
          payload.expectedCloseDate = form.expectedCloseDate;
        }

        saved = await updateOpportunity(opportunity.id, payload);
      } else {
        const payload: CreateOpportunityRequest = {
          name,

          stageId: form.stageId,

          amount,

          probability,

          customerId: optional(form.customerId),

          leadId: optional(form.leadId),

          ownerUserId: optional(form.ownerUserId),

          expectedCloseDate: optional(form.expectedCloseDate),

          description: optional(form.description),
        };

        saved = await createOpportunity(payload);
      }

      onSaved(saved);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save opportunity.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      title={opportunity ? "Edit opportunity" : "Add New Opportunity"}
      description={
        opportunity
          ? "Update deal information. Use Change Stage from the action menu to move this deal through the pipeline."
          : "Create a potential sales deal and place it into your pipeline."
      }
      onClose={onClose}
      className="max-w-3xl"
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

          <Button type="submit" form="opportunity-form" loading={submitting}>
            {opportunity ? "Save changes" : "Add Opportunity"}
          </Button>
        </>
      }
    >
      <form id="opportunity-form" onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Opportunity name"
          value={form.name}
          onChange={(event) => updateField("name", event.target.value)}
          placeholder="ERP Implementation Deal"
          required
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <Select
            label="Customer"
            value={form.customerId}
            onChange={(event) => updateField("customerId", event.target.value)}
          >
            <option value="" disabled={Boolean(opportunity?.customerId)}>
              {opportunity?.customerId ? "Current customer" : "No customer"}
            </option>

            {activeCustomers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name} ({customer.customerCode})
              </option>
            ))}
          </Select>

          <Select
            label="Source lead"
            value={form.leadId}
            onChange={(event) => updateField("leadId", event.target.value)}
          >
            <option value="" disabled={Boolean(opportunity?.leadId)}>
              {opportunity?.leadId ? "Current lead" : "No source lead"}
            </option>

            {leads.map((lead) => (
              <option key={lead.id} value={lead.id}>
                {formatLeadLabel(lead)}
              </option>
            ))}
          </Select>
        </div>

        {!opportunity ? (
          <Select
            label="Pipeline stage"
            value={form.stageId}
            onChange={(event) => handleStageChange(event.target.value)}
            required
          >
            {openStages.length === 0 ? (
              <option value="">No open stages available</option>
            ) : null}

            {openStages.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.name} ({stage.probability}
                %)
              </option>
            ))}
          </Select>
        ) : (
          <Input
            label="Current stage"
            value={currentStage?.name ?? "Unknown stage"}
            disabled
          />
        )}

        <div className="grid gap-5 sm:grid-cols-3">
          <Input
            label="Deal value"
            type="number"
            min="0"
            step="0.01"
            value={form.amount}
            onChange={(event) => updateField("amount", event.target.value)}
          />

          <Input
            label="Probability (%)"
            type="number"
            min="0"
            max="100"
            step="1"
            value={form.probability}
            onChange={(event) => updateField("probability", event.target.value)}
          />

          <Input
            label="Expected close"
            type="date"
            value={form.expectedCloseDate}
            onChange={(event) =>
              updateField("expectedCloseDate", event.target.value)
            }
          />
        </div>

        <Select
          label="Assigned to"
          value={form.ownerUserId}
          onChange={(event) => updateField("ownerUserId", event.target.value)}
        >
          <option value="" disabled={Boolean(opportunity?.ownerUserId)}>
            {opportunity?.ownerUserId ? "Current owner" : "Unassigned"}
          </option>

          {activeUsers.map((user) => (
            <option key={user.id} value={user.id}>
              {user.firstName} {user.lastName} — {user.role}
            </option>
          ))}
        </Select>

        <Textarea
          label="Description"
          value={form.description}
          onChange={(event) => updateField("description", event.target.value)}
          rows={4}
          placeholder="Products, requirements, commercial notes..."
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

function formatLeadLabel(lead: Lead): string {
  const contact = `${lead.firstName} ${lead.lastName}`;

  if (lead.companyName) {
    return `${lead.companyName} — ${contact}`;
  }

  return contact;
}
