"use client";

import { useEffect, useState, type FormEvent } from "react";

import { Button, Input, Modal, Select, Textarea } from "@/components/ui";

import { createLead, updateLead } from "@/lib/leads";

import type {
  CreateLeadRequest,
  EditableLeadStatus,
  Lead,
  LeadStatus,
  UpdateLeadRequest,
} from "@/types/lead";

interface LeadModalProps {
  open: boolean;

  lead?: Lead | null;

  onClose: () => void;

  onSaved: (lead: Lead) => void;
}

interface FormState {
  firstName: string;
  lastName: string;

  companyName: string;
  jobTitle: string;

  email: string;
  phone: string;
  mobile: string;

  source: string;

  status: LeadStatus;

  notes: string;
}

const EMPTY_FORM: FormState = {
  firstName: "",
  lastName: "",

  companyName: "",
  jobTitle: "",

  email: "",
  phone: "",
  mobile: "",

  source: "",

  status: "NEW",

  notes: "",
};

export function LeadModal({
  open,

  lead,

  onClose,

  onSaved,
}: LeadModalProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const converted = lead?.status === "CONVERTED";

  useEffect(() => {
    if (!open) {
      return;
    }

    if (lead) {
      setForm({
        firstName: lead.firstName,

        lastName: lead.lastName,

        companyName: lead.companyName ?? "",

        jobTitle: lead.jobTitle ?? "",

        email: lead.email ?? "",

        phone: lead.phone ?? "",

        mobile: lead.mobile ?? "",

        source: lead.source ?? "",

        status: lead.status,

        notes: lead.notes ?? "",
      });
    } else {
      setForm(EMPTY_FORM);
    }

    setError(null);
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

  function optional(value: string): string | undefined {
    const result = value.trim();

    return result || undefined;
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    const firstName = form.firstName.trim();

    const lastName = form.lastName.trim();

    if (!firstName || !lastName) {
      setError("First name and last name are required.");

      return;
    }

    setSubmitting(true);

    setError(null);

    try {
      let saved: Lead;

      if (lead) {
        const payload: UpdateLeadRequest = {
          firstName,

          lastName,

          companyName: optional(form.companyName),

          jobTitle: optional(form.jobTitle),

          email: optional(form.email)?.toLowerCase(),

          phone: optional(form.phone),

          mobile: optional(form.mobile),

          source: optional(form.source),

          notes: optional(form.notes),
        };

        if (!converted) {
          payload.status = form.status as EditableLeadStatus;
        }

        saved = await updateLead(lead.id, payload);
      } else {
        const payload: CreateLeadRequest = {
          firstName,

          lastName,

          companyName: optional(form.companyName),

          jobTitle: optional(form.jobTitle),

          email: optional(form.email)?.toLowerCase(),

          phone: optional(form.phone),

          mobile: optional(form.mobile),

          source: optional(form.source),

          status: form.status as EditableLeadStatus,

          notes: optional(form.notes),
        };

        saved = await createLead(payload);
      }

      onSaved(saved);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save lead.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose(): void {
    if (submitting) {
      return;
    }

    onClose();
  }

  return (
    <Modal
      open={open}
      title={lead ? "Edit lead" : "Add New Lead"}
      description={
        converted
          ? "Update lead information. Converted status is managed by the opportunity conversion workflow."
          : "Enter company and contact information for this sales lead."
      }
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

          <Button type="submit" form="lead-form" loading={submitting}>
            {lead ? "Save changes" : "Add Lead"}
          </Button>
        </>
      }
    >
      <form id="lead-form" onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="First Name"
            value={form.firstName}
            onChange={(event) => updateField("firstName", event.target.value)}
            required
          />

          <Input
            label="Last Name"
            value={form.lastName}
            onChange={(event) => updateField("lastName", event.target.value)}
            required
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="Company"
            value={form.companyName}
            onChange={(event) => updateField("companyName", event.target.value)}
          />

          <Input
            label="Job Title"
            value={form.jobTitle}
            onChange={(event) => updateField("jobTitle", event.target.value)}
          />
        </div>

        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={(event) => updateField("email", event.target.value)}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="Phone"
            value={form.phone}
            onChange={(event) => updateField("phone", event.target.value)}
          />

          <Input
            label="Mobile"
            value={form.mobile}
            onChange={(event) => updateField("mobile", event.target.value)}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="Source"
            value={form.source}
            onChange={(event) => updateField("source", event.target.value)}
            placeholder="Website, referral, event..."
          />

          <Select
            label="Status"
            value={form.status}
            disabled={converted}
            onChange={(event) => updateField("status", event.target.value)}
          >
            <option value="NEW">New</option>

            <option value="CONTACTED">Contacted</option>

            <option value="QUALIFIED">Qualified</option>

            <option value="DISQUALIFIED">Disqualified</option>

            {converted ? <option value="CONVERTED">Converted</option> : null}
          </Select>
        </div>

        {converted ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            This lead has been converted to an opportunity. Its conversion
            status cannot be changed manually.
          </div>
        ) : null}

        <Textarea
          label="Notes"
          value={form.notes}
          onChange={(event) => updateField("notes", event.target.value)}
          rows={4}
        />

        {error ? (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}
      </form>
    </Modal>
  );
}
