"use client";

import { FormEvent, useEffect, useState } from "react";
import { Building2, Save } from "lucide-react";

import { apiRequest } from "@/lib/api";
import type {
  Organization,
  UpdateOrganizationInput,
} from "@/types/organization";

const emptyOrganization: Organization = {
  id: "",
  name: "",
  code: "",
  legalName: null,
  registrationNumber: null,
  taxNumber: null,
  email: null,
  phone: null,
  website: null,
  addressLine1: null,
  addressLine2: null,
  city: null,
  state: null,
  postalCode: null,
  country: null,
  currencyCode: "USD",
  timezone: "UTC",
  logoUrl: null,
  createdAt: "",
  updatedAt: "",
};

export default function OrganizationSettingsPage() {
  const [organization, setOrganization] =
    useState<Organization>(emptyOrganization);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadOrganization();
  }, []);

  async function loadOrganization(): Promise<void> {
    setLoading(true);
    setError(null);

    try {
      const result = await apiRequest<Organization>("/organizations/current");

      setOrganization(result);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load organization",
      );
    } finally {
      setLoading(false);
    }
  }

  function updateField(
    field: keyof UpdateOrganizationInput,
    value: string,
  ): void {
    setOrganization((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    setSaving(true);
    setMessage(null);
    setError(null);

    const payload: UpdateOrganizationInput = {
      name: organization.name,
      legalName: organization.legalName,
      registrationNumber: organization.registrationNumber,
      taxNumber: organization.taxNumber,
      email: organization.email,
      phone: organization.phone,
      website: organization.website,
      addressLine1: organization.addressLine1,
      addressLine2: organization.addressLine2,
      city: organization.city,
      state: organization.state,
      postalCode: organization.postalCode,
      country: organization.country,
      currencyCode: organization.currencyCode,
      timezone: organization.timezone,
      logoUrl: organization.logoUrl,
    };

    const sanitizedPayload = Object.fromEntries(
      Object.entries(payload).map(([key, value]) => [
        key,
        typeof value === "string" && value.trim() === "" ? undefined : value,
      ]),
    );

    try {
      const result = await apiRequest<Organization>("/organizations/current", {
        method: "PATCH",
        body: JSON.stringify(sanitizedPayload),
      });

      setOrganization(result);
      setMessage("Organization updated successfully.");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update organization",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Loading organization...</p>;
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex items-start gap-4">
        <div className="rounded-xl bg-blue-600 p-3 text-white">
          <Building2 size={24} />
        </div>

        <div>
          <p className="text-sm font-medium text-blue-600">Settings</p>

          <h1 className="text-3xl font-semibold text-slate-900">
            Organization profile
          </h1>

          <p className="mt-2 text-slate-500">
            Maintain company identity, contact, address, and regional settings.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Company information
          </h2>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <Field
              label="Display name"
              value={organization.name}
              onChange={(value) => updateField("name", value)}
              required
            />

            <Field
              label="Organization code"
              value={organization.code}
              disabled
            />

            <Field
              label="Legal name"
              value={organization.legalName ?? ""}
              onChange={(value) => updateField("legalName", value)}
            />

            <Field
              label="Registration number"
              value={organization.registrationNumber ?? ""}
              onChange={(value) => updateField("registrationNumber", value)}
            />

            <Field
              label="Tax / VAT number"
              value={organization.taxNumber ?? ""}
              onChange={(value) => updateField("taxNumber", value)}
            />

            <Field
              label="Logo URL"
              value={organization.logoUrl ?? ""}
              onChange={(value) => updateField("logoUrl", value)}
            />
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Contact details
          </h2>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <Field
              label="Email"
              type="email"
              value={organization.email ?? ""}
              onChange={(value) => updateField("email", value)}
            />

            <Field
              label="Phone"
              value={organization.phone ?? ""}
              onChange={(value) => updateField("phone", value)}
            />

            <Field
              label="Website"
              type="url"
              value={organization.website ?? ""}
              onChange={(value) => updateField("website", value)}
            />
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Address</h2>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <Field
              label="Address line 1"
              value={organization.addressLine1 ?? ""}
              onChange={(value) => updateField("addressLine1", value)}
            />

            <Field
              label="Address line 2"
              value={organization.addressLine2 ?? ""}
              onChange={(value) => updateField("addressLine2", value)}
            />

            <Field
              label="City"
              value={organization.city ?? ""}
              onChange={(value) => updateField("city", value)}
            />

            <Field
              label="State / Province"
              value={organization.state ?? ""}
              onChange={(value) => updateField("state", value)}
            />

            <Field
              label="Postal code"
              value={organization.postalCode ?? ""}
              onChange={(value) => updateField("postalCode", value)}
            />

            <Field
              label="Country"
              value={organization.country ?? ""}
              onChange={(value) => updateField("country", value)}
            />
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Regional settings
          </h2>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <Field
              label="Currency code"
              value={organization.currencyCode}
              maxLength={3}
              onChange={(value) =>
                updateField("currencyCode", value.toUpperCase())
              }
            />

            <Field
              label="Timezone"
              value={organization.timezone}
              onChange={(value) => updateField("timezone", value)}
            />
          </div>
        </section>

        {message ? (
          <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
            {message}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            <Save size={18} />

            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

interface FieldProps {
  label: string;
  value: string;
  type?: string;
  disabled?: boolean;
  required?: boolean;
  maxLength?: number;
  onChange?: (value: string) => void;
}

function Field({
  label,
  value,
  type = "text",
  disabled = false,
  required = false,
  maxLength,
  onChange,
}: FieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </span>

      <input
        type={type}
        value={value}
        disabled={disabled}
        required={required}
        maxLength={maxLength}
        onChange={(event) => onChange?.(event.target.value)}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
      />
    </label>
  );
}
