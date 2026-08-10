"use client";

import { useEffect, useState, type FormEvent } from "react";

import { Button, Input, Modal } from "@/components/ui";

import {
  createCustomerContact,
  updateCustomerContact,
} from "@/lib/customer-contacts";

import type {
  CreateCustomerContactRequest,
  CustomerContact,
} from "@/types/customer-contact";

interface CustomerContactModalProps {
  open: boolean;
  customerId: string;
  contact?: CustomerContact | null;

  onClose: () => void;

  onSaved: (contact: CustomerContact) => void;
}

const EMPTY_FORM: CreateCustomerContactRequest = {
  firstName: "",
  lastName: "",
  jobTitle: "",
  email: "",
  phone: "",
  mobile: "",
  isPrimary: false,
  isActive: true,
};

export function CustomerContactModal({
  open,
  customerId,
  contact,
  onClose,
  onSaved,
}: CustomerContactModalProps) {
  const [form, setForm] = useState<CreateCustomerContactRequest>(EMPTY_FORM);

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (contact) {
      setForm({
        firstName: contact.firstName,
        lastName: contact.lastName,
        jobTitle: contact.jobTitle ?? "",
        email: contact.email ?? "",
        phone: contact.phone ?? "",
        mobile: contact.mobile ?? "",
        isPrimary: contact.isPrimary,
        isActive: contact.isActive,
      });
    } else {
      setForm({
        ...EMPTY_FORM,
      });
    }

    setError(null);
  }, [contact, open]);

  function updateField<Key extends keyof CreateCustomerContactRequest>(
    key: Key,
    value: CreateCustomerContactRequest[Key],
  ): void {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function cleanOptional(value?: string): string | undefined {
    const normalized = value?.trim();

    return normalized ? normalized : undefined;
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
      const payload: CreateCustomerContactRequest = {
        firstName,
        lastName,

        jobTitle: cleanOptional(form.jobTitle),

        email: cleanOptional(form.email),

        phone: cleanOptional(form.phone),

        mobile: cleanOptional(form.mobile),

        isPrimary: form.isPrimary ?? false,

        isActive: form.isActive ?? true,
      };

      const saved = contact
        ? await updateCustomerContact(customerId, contact.id, payload)
        : await createCustomerContact(customerId, payload);

      onSaved(saved);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save contact.",
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
      title={contact ? "Edit contact" : "Add contact"}
      description={
        contact
          ? "Update this customer's contact information."
          : "Add a person associated with this customer."
      }
      onClose={handleClose}
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
            form="customer-contact-form"
            loading={submitting}
          >
            {contact ? "Save changes" : "Add contact"}
          </Button>
        </>
      }
    >
      <form
        id="customer-contact-form"
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="First name"
            value={form.firstName}
            onChange={(event) => updateField("firstName", event.target.value)}
            maxLength={100}
            required
          />

          <Input
            label="Last name"
            value={form.lastName}
            onChange={(event) => updateField("lastName", event.target.value)}
            maxLength={100}
            required
          />
        </div>

        <Input
          label="Job title"
          value={form.jobTitle ?? ""}
          onChange={(event) => updateField("jobTitle", event.target.value)}
          maxLength={150}
          placeholder="Sales Manager"
        />

        <Input
          label="Email"
          type="email"
          value={form.email ?? ""}
          onChange={(event) => updateField("email", event.target.value)}
          maxLength={320}
          placeholder="name@example.com"
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="Phone"
            value={form.phone ?? ""}
            onChange={(event) => updateField("phone", event.target.value)}
            maxLength={50}
          />

          <Input
            label="Mobile"
            value={form.mobile ?? ""}
            onChange={(event) => updateField("mobile", event.target.value)}
            maxLength={50}
          />
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4">
          <input
            type="checkbox"
            checked={form.isPrimary ?? false}
            onChange={(event) => updateField("isPrimary", event.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300"
          />

          <span>
            <span className="block text-sm font-medium text-slate-900">
              Primary contact
            </span>

            <span className="mt-1 block text-sm leading-5 text-slate-500">
              Make this the main contact for the customer.
            </span>
          </span>
        </label>

        {error ? (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}
      </form>
    </Modal>
  );
}
