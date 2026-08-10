"use client";

import { type FormEvent, useState } from "react";

import { Button, Input, Modal, Textarea } from "@/components/ui";
import { createCustomer } from "@/lib/customers";
import type { CreateCustomerRequest, Customer } from "@/types/customer";

interface CreateCustomerModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (customer: Customer) => void;
}

interface CustomerFormState {
  customerCode: string;
  name: string;
  legalName: string;
  taxNumber: string;
  email: string;
  phone: string;
  website: string;
  notes: string;
}

const initialForm: CustomerFormState = {
  customerCode: "",
  name: "",
  legalName: "",
  taxNumber: "",
  email: "",
  phone: "",
  website: "",
  notes: "",
};

export function CreateCustomerModal({
  open,
  onClose,
  onCreated,
}: CreateCustomerModalProps) {
  const [form, setForm] = useState<CustomerFormState>(initialForm);

  const [error, setError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);

  function updateField(key: keyof CustomerFormState, value: string): void {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function resetForm(): void {
    setForm(initialForm);
    setError(null);
  }

  function handleClose(): void {
    if (submitting) {
      return;
    }

    resetForm();
    onClose();
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    setError(null);

    const customerCode = form.customerCode.trim().toUpperCase();

    const name = form.name.trim();

    if (!customerCode) {
      setError("Customer code is required.");

      return;
    }

    if (!name) {
      setError("Customer name is required.");

      return;
    }

    const payload: CreateCustomerRequest = {
      customerCode,
      name,
    };

    const legalName = form.legalName.trim();

    const taxNumber = form.taxNumber.trim();

    const email = form.email.trim().toLowerCase();

    const phone = form.phone.trim();

    const website = form.website.trim();

    const notes = form.notes.trim();

    if (legalName) {
      payload.legalName = legalName;
    }

    if (taxNumber) {
      payload.taxNumber = taxNumber;
    }

    if (email) {
      payload.email = email;
    }

    if (phone) {
      payload.phone = phone;
    }

    if (website) {
      payload.website = website;
    }

    if (notes) {
      payload.notes = notes;
    }

    setSubmitting(true);

    try {
      const created = await createCustomer(payload);

      resetForm();

      onCreated(created);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to create customer.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      title="Create customer"
      description="Add a customer to your sales workspace."
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
            form="create-customer-form"
            loading={submitting}
          >
            Create customer
          </Button>
        </>
      }
    >
      <form
        id="create-customer-form"
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="Customer code"
            value={form.customerCode}
            onChange={(event) =>
              updateField("customerCode", event.target.value)
            }
            placeholder="CUST-001"
            maxLength={50}
            required
          />

          <Input
            label="Customer name"
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            placeholder="Acme Trading"
            maxLength={200}
            required
          />
        </div>

        <Input
          label="Legal name"
          value={form.legalName}
          onChange={(event) => updateField("legalName", event.target.value)}
          placeholder="Acme Trading Pvt. Ltd."
          maxLength={200}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
            placeholder="accounts@example.com"
            maxLength={320}
          />

          <Input
            label="Phone"
            value={form.phone}
            onChange={(event) => updateField("phone", event.target.value)}
            placeholder="+977 9800000000"
            maxLength={50}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="Tax number"
            value={form.taxNumber}
            onChange={(event) => updateField("taxNumber", event.target.value)}
            placeholder="VAT / PAN"
            maxLength={100}
          />

          <Input
            label="Website"
            type="url"
            value={form.website}
            onChange={(event) => updateField("website", event.target.value)}
            placeholder="https://example.com"
            maxLength={500}
          />
        </div>

        <Textarea
          label="Notes"
          value={form.notes}
          onChange={(event) => updateField("notes", event.target.value)}
          placeholder="Internal notes about this customer..."
          maxLength={5000}
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
