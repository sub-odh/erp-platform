"use client";

import { ArrowRightCircle, Building2, UserRound } from "lucide-react";

import { useEffect, useState, type FormEvent } from "react";

import { Button, Input, Modal, Select, Textarea } from "@/components/ui";

import { getCustomers } from "@/lib/customers";
import { convertLead } from "@/lib/leads";
import { getPipelineStages } from "@/lib/pipeline-stages";
import { getUsers } from "@/lib/users";

import type { Customer } from "@/types/customer";

import type {
  ConvertLeadRequest,
  ConvertLeadResponse,
  Lead,
} from "@/types/lead";

import type { PipelineStage } from "@/types/pipeline-stage";

import type { User } from "@/types/user";

interface LeadConversionModalProps {
  open: boolean;

  lead: Lead | null;

  onClose: () => void;

  onConverted: (result: ConvertLeadResponse) => void;
}

interface FormState {
  name: string;

  customerId: string;

  stageId: string;

  ownerUserId: string;

  amount: string;

  expectedCloseDate: string;

  description: string;
}

const EMPTY_FORM: FormState = {
  name: "",

  customerId: "",

  stageId: "",

  ownerUserId: "",

  amount: "",

  expectedCloseDate: "",

  description: "",
};

export function LeadConversionModal({
  open,

  lead,

  onClose,

  onConverted,
}: LeadConversionModalProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const [stages, setStages] = useState<PipelineStage[]>([]);

  const [customers, setCustomers] = useState<Customer[]>([]);

  const [users, setUsers] = useState<User[]>([]);

  const [loadingReferences, setLoadingReferences] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !lead) {
      return;
    }

    const currentLead = lead;

    let cancelled = false;

    setForm({
      ...EMPTY_FORM,

      name: createDefaultOpportunityName(currentLead),
    });

    setError(null);

    setLoadingReferences(true);

    async function loadReferences(): Promise<void> {
      try {
        const [stageResult, customerResult, userResult] = await Promise.all([
          getPipelineStages(),

          getCustomers({
            isActive: true,

            page: 1,

            limit: 100,

            sortBy: "name",

            sortDirection: "asc",
          }),

          getUsers({
            status: "active",

            page: 1,

            limit: 100,

            sortBy: "firstName",

            sortDirection: "asc",
          }),
        ]);

        if (cancelled) {
          return;
        }

        const openStages = stageResult
          .filter((stage) => stage.isActive && !stage.isClosed)
          .sort((left, right) => left.position - right.position);

        const defaultStage =
          openStages.find(
            (stage) => stage.name.toLowerCase() === "qualification",
          ) ?? openStages[0];

        const activeCustomers = customerResult.data.filter(
          (customer) => customer.isActive,
        );

        const activeUsers = userResult.data.filter(
          (user) => user.isActive && !user.deletedAt,
        );

        setStages(openStages);

        setCustomers(activeCustomers);

        setUsers(activeUsers);

        const leadOwnerIsAvailable =
          Boolean(currentLead.ownerUserId) &&
          activeUsers.some((user) => user.id === currentLead.ownerUserId);

        setForm((current) => ({
          ...current,

          stageId: defaultStage?.id ?? "",

          ownerUserId: leadOwnerIsAvailable
            ? (currentLead.ownerUserId ?? "")
            : "",
        }));

        if (!defaultStage) {
          setError(
            "No active open pipeline stage is available. Create or activate an open pipeline stage before converting this lead.",
          );
        }
      } catch (requestError) {
        if (cancelled) {
          return;
        }

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load conversion options.",
        );
      } finally {
        if (!cancelled) {
          setLoadingReferences(false);
        }
      }
    }

    void loadReferences();

    return () => {
      cancelled = true;
    };
  }, [lead, open]);

  function updateField(
    key: keyof FormState,

    value: string,
  ): void {
    setForm((current) => ({
      ...current,

      [key]: value,
    }));
  }

  function handleClose(): void {
    if (submitting) {
      return;
    }

    onClose();
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (!lead) {
      return;
    }

    if (lead.status !== "QUALIFIED") {
      setError("Only qualified leads can be converted to opportunities.");

      return;
    }

    const name = form.name.trim();

    if (!name) {
      setError("Opportunity name is required.");

      return;
    }

    if (!form.stageId) {
      setError("Initial deal stage is required.");

      return;
    }

    let amount: number | undefined;

    if (form.amount.trim()) {
      amount = Number(form.amount);

      if (!Number.isFinite(amount) || amount < 0) {
        setError(
          "Deal value must be a valid number greater than or equal to zero.",
        );

        return;
      }
    }

    const payload: ConvertLeadRequest = {
      name,

      stageId: form.stageId,

      customerId: form.customerId || undefined,

      ownerUserId: form.ownerUserId || undefined,

      amount,

      expectedCloseDate: form.expectedCloseDate || undefined,

      description: form.description.trim() || undefined,
    };

    setSubmitting(true);

    setError(null);

    try {
      const result = await convertLead(
        lead.id,

        payload,
      );

      onConverted(result);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to convert lead.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const selectedStage =
    stages.find((stage) => stage.id === form.stageId) ?? null;

  return (
    <Modal
      open={open}
      title="Convert to Opportunity"
      description="Create a sales opportunity from this qualified lead."
      onClose={handleClose}
      className="max-w-2xl"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            disabled={submitting}
            onClick={handleClose}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            form="lead-conversion-form"
            disabled={loadingReferences || !form.stageId}
            loading={submitting}
          >
            <ArrowRightCircle size={17} />
            Convert to Opportunity
          </Button>
        </>
      }
    >
      <form
        id="lead-conversion-form"
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        {lead ? (
          <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-blue-600 ring-1 ring-blue-100">
                <Building2 size={17} />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">
                  Source lead
                </p>

                <p className="mt-1 font-semibold text-slate-900">
                  {lead.companyName || `${lead.firstName} ${lead.lastName}`}
                </p>

                <p className="mt-0.5 text-sm text-slate-600">
                  {lead.firstName} {lead.lastName}
                  {lead.email ? ` · ${lead.email}` : ""}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {loadingReferences ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Loading customers, pipeline stages and users...
          </div>
        ) : null}

        <Input
          label="Opportunity Name"
          value={form.name}
          onChange={(event) =>
            updateField(
              "name",

              event.target.value,
            )
          }
          required
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <Select
            label="Customer"
            value={form.customerId}
            disabled={loadingReferences}
            onChange={(event) =>
              updateField(
                "customerId",

                event.target.value,
              )
            }
          >
            <option value="">No Customer Linked</option>

            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </Select>

          <Select
            label="Initial Deal Stage"
            value={form.stageId}
            disabled={loadingReferences}
            onChange={(event) =>
              updateField(
                "stageId",

                event.target.value,
              )
            }
            required
          >
            <option value="">Select Stage</option>

            {stages.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.name} ({stage.probability}%)
              </option>
            ))}
          </Select>
        </div>

        {selectedStage ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Starting probability will be{" "}
            <span className="font-semibold text-slate-800">
              {selectedStage.probability}%
            </span>{" "}
            based on the selected deal stage.
          </div>
        ) : null}

        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="Deal Value"
            type="number"
            min="0"
            step="0.01"
            value={form.amount}
            onChange={(event) =>
              updateField(
                "amount",

                event.target.value,
              )
            }
            placeholder="0.00"
          />

          <Input
            label="Expected Close Date"
            type="date"
            value={form.expectedCloseDate}
            onChange={(event) =>
              updateField(
                "expectedCloseDate",

                event.target.value,
              )
            }
          />
        </div>

        <Select
          label="Assigned To"
          value={form.ownerUserId}
          disabled={loadingReferences}
          onChange={(event) =>
            updateField(
              "ownerUserId",

              event.target.value,
            )
          }
        >
          <option value="">
            {lead?.ownerUserId ? "Use lead owner" : "Unassigned"}
          </option>

          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.firstName} {user.lastName}
            </option>
          ))}
        </Select>

        {lead?.ownerUserId ? (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <UserRound size={14} />
            If no different owner is selected, the lead owner remains
            responsible for the opportunity.
          </div>
        ) : null}

        <Textarea
          label="Description"
          value={form.description}
          onChange={(event) =>
            updateField(
              "description",

              event.target.value,
            )
          }
          rows={4}
          placeholder="Optional notes about this opportunity..."
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

function createDefaultOpportunityName(lead: Lead): string {
  const sourceName =
    lead.companyName?.trim() || `${lead.firstName} ${lead.lastName}`.trim();

  return `${sourceName} Opportunity`;
}
