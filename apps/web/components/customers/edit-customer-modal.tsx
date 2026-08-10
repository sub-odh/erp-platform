"use client";

import { type FormEvent, useEffect, useState } from "react";

import { Button, Input, Modal, Textarea } from "@/components/ui";

import { updateCustomer } from "@/lib/customers";

import type { Customer, UpdateCustomerRequest } from "@/types/customer";

interface EditCustomerModalProps {
  open: boolean;
  customer: Customer | null;

  onClose: () => void;

  onUpdated: (customer: Customer) => void;
}

interface FormState {
  customerCode: string;
  name: string;

  legalName: string;
  taxNumber: string;

  email: string;
  phone: string;
  website: string;

  billingAddressLine1: string;
  billingAddressLine2: string;
  billingCity: string;
  billingState: string;
  billingPostalCode: string;
  billingCountry: string;

  shippingAddressLine1: string;
  shippingAddressLine2: string;
  shippingCity: string;
  shippingState: string;
  shippingPostalCode: string;
  shippingCountry: string;

  creditLimit: string;
  paymentTermsDays: string;

  notes: string;
}

const emptyForm: FormState = {
  customerCode: "",
  name: "",

  legalName: "",
  taxNumber: "",

  email: "",
  phone: "",
  website: "",

  billingAddressLine1: "",
  billingAddressLine2: "",
  billingCity: "",
  billingState: "",
  billingPostalCode: "",
  billingCountry: "",

  shippingAddressLine1: "",
  shippingAddressLine2: "",
  shippingCity: "",
  shippingState: "",
  shippingPostalCode: "",
  shippingCountry: "",

  creditLimit: "0.00",
  paymentTermsDays: "0",

  notes: "",
};

export function EditCustomerModal({
  open,
  customer,
  onClose,
  onUpdated,
}: EditCustomerModalProps) {
  const [form, setForm] = useState<FormState>(emptyForm);

  const [error, setError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!customer) {
      setForm(emptyForm);
      return;
    }

    setForm({
      customerCode: customer.customerCode,

      name: customer.name,

      legalName: customer.legalName ?? "",

      taxNumber: customer.taxNumber ?? "",

      email: customer.email ?? "",

      phone: customer.phone ?? "",

      website: customer.website ?? "",

      billingAddressLine1: customer.billingAddressLine1 ?? "",

      billingAddressLine2: customer.billingAddressLine2 ?? "",

      billingCity: customer.billingCity ?? "",

      billingState: customer.billingState ?? "",

      billingPostalCode: customer.billingPostalCode ?? "",

      billingCountry: customer.billingCountry ?? "",

      shippingAddressLine1: customer.shippingAddressLine1 ?? "",

      shippingAddressLine2: customer.shippingAddressLine2 ?? "",

      shippingCity: customer.shippingCity ?? "",

      shippingState: customer.shippingState ?? "",

      shippingPostalCode: customer.shippingPostalCode ?? "",

      shippingCountry: customer.shippingCountry ?? "",

      creditLimit: customer.creditLimit,

      paymentTermsDays: String(customer.paymentTermsDays),

      notes: customer.notes ?? "",
    });

    setError(null);
  }, [customer]);

  function updateField(key: keyof FormState, value: string): void {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function handleClose(): void {
    if (submitting) {
      return;
    }

    setError(null);

    onClose();
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (!customer) {
      return;
    }

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

    const creditLimit = Number(form.creditLimit || "0");

    if (!Number.isFinite(creditLimit) || creditLimit < 0) {
      setError("Credit limit must be zero or greater.");

      return;
    }

    const paymentTermsDays = Number(form.paymentTermsDays || "0");

    if (
      !Number.isInteger(paymentTermsDays) ||
      paymentTermsDays < 0 ||
      paymentTermsDays > 99999
    ) {
      setError("Payment terms must be a whole number between 0 and 99999.");

      return;
    }

    const payload: UpdateCustomerRequest = {
      customerCode,
      name,

      legalName: form.legalName.trim(),

      taxNumber: form.taxNumber.trim(),

      email: form.email.trim().toLowerCase(),

      phone: form.phone.trim(),

      website: form.website.trim(),

      billingAddressLine1: form.billingAddressLine1.trim(),

      billingAddressLine2: form.billingAddressLine2.trim(),

      billingCity: form.billingCity.trim(),

      billingState: form.billingState.trim(),

      billingPostalCode: form.billingPostalCode.trim(),

      billingCountry: form.billingCountry.trim(),

      shippingAddressLine1: form.shippingAddressLine1.trim(),

      shippingAddressLine2: form.shippingAddressLine2.trim(),

      shippingCity: form.shippingCity.trim(),

      shippingState: form.shippingState.trim(),

      shippingPostalCode: form.shippingPostalCode.trim(),

      shippingCountry: form.shippingCountry.trim(),

      creditLimit,

      paymentTermsDays,

      notes: form.notes.trim(),
    };

    setSubmitting(true);
    setError(null);

    try {
      const updated = await updateCustomer(customer.id, payload);

      onUpdated(updated);

      onClose();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update customer.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      title="Edit customer"
      description="Update customer information, addresses, and financial terms."
      onClose={handleClose}
      className="max-w-4xl"
      footer={
        <>
          <Button variant="outline" disabled={submitting} onClick={handleClose}>
            Cancel
          </Button>

          <Button type="submit" form="edit-customer-form" loading={submitting}>
            Save changes
          </Button>
        </>
      }
    >
      <form
        id="edit-customer-form"
        onSubmit={handleSubmit}
        className="space-y-8"
      >
        <FormSection
          title="Customer information"
          description="General company and contact information."
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label="Customer code"
              value={form.customerCode}
              onChange={(event) =>
                updateField("customerCode", event.target.value)
              }
              maxLength={50}
              required
            />

            <Input
              label="Customer name"
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              maxLength={200}
              required
            />

            <Input
              label="Legal name"
              value={form.legalName}
              onChange={(event) => updateField("legalName", event.target.value)}
              maxLength={200}
            />

            <Input
              label="Tax number"
              value={form.taxNumber}
              onChange={(event) => updateField("taxNumber", event.target.value)}
              maxLength={100}
            />

            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              maxLength={320}
            />

            <Input
              label="Phone"
              value={form.phone}
              onChange={(event) => updateField("phone", event.target.value)}
              maxLength={50}
            />

            <div className="sm:col-span-2">
              <Input
                label="Website"
                type="url"
                value={form.website}
                onChange={(event) => updateField("website", event.target.value)}
                placeholder="https://example.com"
                maxLength={500}
              />
            </div>
          </div>
        </FormSection>

        <FormSection
          title="Billing address"
          description="Address used for invoices and billing."
        >
          <AddressFields prefix="billing" form={form} onChange={updateField} />
        </FormSection>

        <FormSection
          title="Shipping address"
          description="Default delivery address."
        >
          <AddressFields prefix="shipping" form={form} onChange={updateField} />
        </FormSection>

        <FormSection
          title="Financial terms"
          description="Default sales credit and payment settings."
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label="Credit limit"
              type="number"
              min="0"
              step="0.01"
              value={form.creditLimit}
              onChange={(event) =>
                updateField("creditLimit", event.target.value)
              }
            />

            <Input
              label="Payment terms (days)"
              type="number"
              min="0"
              max="99999"
              step="1"
              value={form.paymentTermsDays}
              onChange={(event) =>
                updateField("paymentTermsDays", event.target.value)
              }
            />
          </div>
        </FormSection>

        <FormSection
          title="Internal notes"
          description="Private notes visible to your organization."
        >
          <Textarea
            value={form.notes}
            onChange={(event) => updateField("notes", event.target.value)}
            rows={5}
            maxLength={5000}
          />
        </FormSection>

        {error ? (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}
      </form>
    </Modal>
  );
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-4">
        <h3 className="font-semibold text-slate-900">{title}</h3>

        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>

      {children}
    </section>
  );
}

function AddressFields({
  prefix,
  form,
  onChange,
}: {
  prefix: "billing" | "shipping";

  form: FormState;

  onChange: (key: keyof FormState, value: string) => void;
}) {
  const line1 = `${prefix}AddressLine1` as keyof FormState;

  const line2 = `${prefix}AddressLine2` as keyof FormState;

  const city = `${prefix}City` as keyof FormState;

  const state = `${prefix}State` as keyof FormState;

  const postal = `${prefix}PostalCode` as keyof FormState;

  const country = `${prefix}Country` as keyof FormState;

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Input
          label="Address line 1"
          value={form[line1]}
          onChange={(event) => onChange(line1, event.target.value)}
          maxLength={255}
        />
      </div>

      <div className="sm:col-span-2">
        <Input
          label="Address line 2"
          value={form[line2]}
          onChange={(event) => onChange(line2, event.target.value)}
          maxLength={255}
        />
      </div>

      <Input
        label="City"
        value={form[city]}
        onChange={(event) => onChange(city, event.target.value)}
        maxLength={100}
      />

      <Input
        label="State / Province"
        value={form[state]}
        onChange={(event) => onChange(state, event.target.value)}
        maxLength={100}
      />

      <Input
        label="Postal code"
        value={form[postal]}
        onChange={(event) => onChange(postal, event.target.value)}
        maxLength={30}
      />

      <Input
        label="Country"
        value={form[country]}
        onChange={(event) => onChange(country, event.target.value)}
        maxLength={100}
      />
    </div>
  );
}
