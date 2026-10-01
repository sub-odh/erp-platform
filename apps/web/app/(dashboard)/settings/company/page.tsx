"use client";

import {
  Building2,
  Database,
  Info,
  RotateCcw,
  Save,
} from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";

import { ImageUploader } from "@/components/media";
import type { ImageUploadPreset } from "@/components/media/image-presets";
import { CompanyBackupPanel } from "@/components/company/company-backup-panel";
import { Button, Input } from "@/components/ui";
import { getStoredUser } from "@/lib/auth";
import {
  getCurrentCompany,
  removeFavicon,
  removeInvoiceLogo,
  removeCompanyLogo,
  resetCompanyData,
  updateCurrentCompany,
  uploadInvoiceLogo,
  uploadCompanyLogo,
  uploadFavicon,
} from "@/lib/company";
import type { Company, UpdateCompanyInput } from "@/types/company";

const emptyCompany: Company = {
  id: "",
  name: "",
  code: "",
  legalName: null,
  registrationNumber: null,
  registrationDate: null,
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
  currencyCode: "NPR",
  timezone: "UTC",
  officeStartTime: null,
  officeEndTime: null,
  logoUrl: null,
  logoFileName: null,
  logoMimeType: null,
  logoSize: null,
  invoiceLogoUrl: null,
  invoiceLogoFileName: null,
  invoiceLogoMimeType: null,
  invoiceLogoSize: null,
  faviconUrl: null,
  faviconFileName: null,
  faviconMimeType: null,
  faviconSize: null,
  createdAt: "",
  updatedAt: "",
};

type CompanySettingsTab = "information" | "backup" | "reset";

export default function CompanySettingsPage() {
  const [company, setCompany] = useState<Company>(emptyCompany);
  const [activeTab, setActiveTab] = useState<CompanySettingsTab>("information");
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoBusy, setLogoBusy] = useState(false);
  const [invoiceLogoBusy, setInvoiceLogoBusy] = useState(false);
  const [faviconBusy, setFaviconBusy] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);
  const [resetConfirmation, setResetConfirmation] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsOwner(getStoredUser()?.role === "OWNER");
    void loadCompany();
  }, []);

  async function loadCompany(): Promise<void> {
    setLoading(true);
    setError(null);

    try {
      setCompany(await getCurrentCompany());
    } catch (requestError) {
      setError(errorMessage(requestError, "Unable to load company settings."));
    } finally {
      setLoading(false);
    }
  }

  function updateField(field: keyof UpdateCompanyInput, value: string): void {
    setCompany((current) => ({ ...current, [field]: value }));
  }

  function publishCompany(value: Company): void {
    window.dispatchEvent(
      new CustomEvent<Company>("erp:company-updated", {
        detail: value,
      }),
    );
  }

  async function updateLogo(
    action: () => Promise<Company>,
    setBusy: (value: boolean) => void,
    successMessage: string,
  ): Promise<void> {
    setBusy(true);
    setMessage(null);
    setError(null);

    try {
      const updated = await action();
      setCompany(updated);
      publishCompany(updated);
      setMessage(successMessage);
    } catch (requestError) {
      setError(errorMessage(requestError, "Unable to update company logo."));
      throw requestError;
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    const payload: UpdateCompanyInput = {
      name: company.name,
      legalName: company.legalName,
      registrationNumber: company.registrationNumber,
      registrationDate: company.registrationDate,
      taxNumber: company.taxNumber,
      email: company.email,
      phone: company.phone,
      website: company.website,
      addressLine1: company.addressLine1,
      addressLine2: company.addressLine2,
      city: company.city,
      state: company.state,
      postalCode: company.postalCode,
      country: company.country,
      currencyCode: company.currencyCode,
      timezone: company.timezone,
      officeStartTime: company.officeStartTime,
      officeEndTime: company.officeEndTime,
    };

    const sanitized = Object.fromEntries(
      Object.entries(payload).map(([key, value]) => [
        key,
        typeof value === "string" && value.trim() === "" ? null : value,
      ]),
    ) as UpdateCompanyInput;

    try {
      const updated = await updateCurrentCompany(sanitized);
      setCompany(updated);
      publishCompany(updated);
      setMessage("Company settings saved successfully.");
    } catch (requestError) {
      setError(errorMessage(requestError, "Unable to save company settings."));
    } finally {
      setSaving(false);
    }
  }

  async function handleReset(): Promise<void> {
    setResetBusy(true);
    setMessage(null);
    setError(null);

    try {
      const result = await resetCompanyData(resetConfirmation, ownerPassword);
      setMessage(result.message);
      setResetConfirmation("");
      setOwnerPassword("");
    } catch (requestError) {
      setError(errorMessage(requestError, "Unable to reset company data."));
    } finally {
      setResetBusy(false);
    }
  }

  if (loading) {
    return <LoadingState />;
  }

  const busy = saving || logoBusy || invoiceLogoBusy || faviconBusy;

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeading />

      <CompanySettingsTabs
        active={activeTab}
        showReset={isOwner}
        onChange={setActiveTab}
      />

      <Feedback message={message} error={error} />

      {activeTab === "information" ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
            <LogoCard
              title="System Logo (Main)"
              preset="companyLogo"
              description="Shown in the navigation and main application shell."
              value={company.logoUrl}
              fileName={company.logoFileName}
              busy={logoBusy}
              disabled={busy && !logoBusy}
              onUpload={(file) =>
                updateLogo(
                  () => uploadCompanyLogo(file),
                  setLogoBusy,
                  "System logo updated successfully.",
                )
              }
              onRemove={() =>
                updateLogo(
                  removeCompanyLogo,
                  setLogoBusy,
                  "System logo removed successfully.",
                )
              }
            />

            <LogoCard
              title="Invoice Logo (Light Background)"
              preset="invoiceLogo"
              description="Used on invoices, delivery orders, and other print documents."
              value={company.invoiceLogoUrl}
              fileName={company.invoiceLogoFileName}
              busy={invoiceLogoBusy}
              disabled={busy && !invoiceLogoBusy}
              onUpload={(file) =>
                updateLogo(
                  () => uploadInvoiceLogo(file),
                  setInvoiceLogoBusy,
                  "Invoice logo updated successfully.",
                )
              }
              onRemove={() =>
                updateLogo(
                  removeInvoiceLogo,
                  setInvoiceLogoBusy,
                  "Invoice logo removed successfully.",
                )
              }
            />

            <LogoCard
              title="Favicon & App Icon"
              preset="favicon"
              description="Square icon used in browser tabs and app shortcuts. A clean symbol or initials works best."
              value={company.faviconUrl}
              fileName={company.faviconFileName}
              busy={faviconBusy}
              disabled={busy && !faviconBusy}
              onUpload={(file) =>
                updateLogo(
                  () => uploadFavicon(file),
                  setFaviconBusy,
                  "Favicon updated successfully.",
                )
              }
              onRemove={() =>
                updateLogo(
                  removeFavicon,
                  setFaviconBusy,
                  "Favicon removed successfully.",
                )
              }
            />
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Company Information
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Configure the details shown on documents, orders, and invoices.
            </p>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <Input
                label="Company Name"
                value={company.name}
                onChange={(event) => updateField("name", event.target.value)}
                required
              />

              <Input label="Company Code" value={company.code} disabled />

              <Input
                label="Legal Name"
                value={company.legalName ?? ""}
                onChange={(event) =>
                  updateField("legalName", event.target.value)
                }
              />

              <Input
                label="Email Address"
                type="email"
                value={company.email ?? ""}
                onChange={(event) => updateField("email", event.target.value)}
              />

              <Input
                label="Contact Number"
                value={company.phone ?? ""}
                onChange={(event) => updateField("phone", event.target.value)}
              />

              <Input
                label="Website"
                type="url"
                value={company.website ?? ""}
                onChange={(event) => updateField("website", event.target.value)}
              />

              <Input
                label="VAT / PAN number"
                value={company.taxNumber ?? ""}
                onChange={(event) =>
                  updateField("taxNumber", event.target.value)
                }
              />

              <Input
                label="Registration Number"
                value={company.registrationNumber ?? ""}
                onChange={(event) =>
                  updateField("registrationNumber", event.target.value)
                }
              />

              <Input
                label="Registration Date"
                type="date"
                value={company.registrationDate ?? ""}
                onChange={(event) =>
                  updateField("registrationDate", event.target.value)
                }
              />

              <div className="hidden md:block" />

              <div className="md:col-span-2">
                <TextareaField
                  label="Office Address"
                  value={company.addressLine1 ?? ""}
                  onChange={(value) => updateField("addressLine1", value)}
                />
              </div>

              <Input
                label="Address Line 2"
                value={company.addressLine2 ?? ""}
                onChange={(event) =>
                  updateField("addressLine2", event.target.value)
                }
              />

              <Input
                label="City"
                value={company.city ?? ""}
                onChange={(event) => updateField("city", event.target.value)}
              />

              <Input
                label="State / Province"
                value={company.state ?? ""}
                onChange={(event) => updateField("state", event.target.value)}
              />

              <Input
                label="Postal Code"
                value={company.postalCode ?? ""}
                onChange={(event) =>
                  updateField("postalCode", event.target.value)
                }
              />

              <Input
                label="Country"
                value={company.country ?? ""}
                onChange={(event) => updateField("country", event.target.value)}
              />

              <div className="hidden md:block" />

              <Input
                label="Office Time Starts"
                type="time"
                value={company.officeStartTime ?? ""}
                onChange={(event) =>
                  updateField("officeStartTime", event.target.value)
                }
              />

              <Input
                label="Office Time Ends"
                type="time"
                value={company.officeEndTime ?? ""}
                onChange={(event) =>
                  updateField("officeEndTime", event.target.value)
                }
              />

              <Input
                label="Currency Code"
                value={company.currencyCode}
                maxLength={3}
                onChange={(event) =>
                  updateField("currencyCode", event.target.value.toUpperCase())
                }
                required
              />

              <Input
                label="Timezone"
                value={company.timezone}
                onChange={(event) =>
                  updateField("timezone", event.target.value)
                }
                required
              />
            </div>
          </section>

          <div className="flex justify-end">
            <Button type="submit" loading={saving} disabled={busy && !saving}>
              <Save size={17} /> Save configuration
            </Button>
          </div>
        </form>
      ) : null}

      {activeTab === "backup" ? (
        <CompanyBackupPanel
          company={company}
          onNotice={(notice) => {
            setMessage(notice);
            setError(null);
          }}
          onError={(notice) => {
            setError(notice);
            setMessage(null);
          }}
        />
      ) : null}

      {activeTab === "reset" ? (
        <ResetCompanyDataPanel
          companyCode={company.code}
          busy={resetBusy}
          confirmation={resetConfirmation}
          ownerPassword={ownerPassword}
          onConfirmationChange={setResetConfirmation}
          onOwnerPasswordChange={setOwnerPassword}
          onReset={() => void handleReset()}
        />
      ) : null}
    </div>
  );
}

function PageHeading() {
  return (
    <div className="mb-7 flex items-start gap-4">
      <div className="rounded-xl bg-blue-600 p-3 text-white">
        <Building2 size={24} />
      </div>

      <div>
        <p className="text-sm font-medium text-blue-600">Administration</p>
        <h1 className="text-3xl font-semibold text-slate-900">
          Company Settings
        </h1>
        <p className="mt-2 text-slate-500">
          Maintain company identity, office details, regional settings, and
          document branding.
        </p>
      </div>
    </div>
  );
}

function CompanySettingsTabs({
  active,
  showReset,
  onChange,
}: {
  active: CompanySettingsTab;
  showReset: boolean;
  onChange: (tab: CompanySettingsTab) => void;
}) {
  const tabs: Array<{
    id: CompanySettingsTab;
    label: string;
    icon: React.ReactNode;
  }> = [
    {
      id: "information",
      label: "Company Information",
      icon: <Info size={17} />,
    },
    {
      id: "backup",
      label: "Database Backup & Restore",
      icon: <Database size={17} />,
    },
    { id: "reset", label: "Reset Company Data", icon: <RotateCcw size={17} /> },
  ];

  const visibleTabs = showReset
    ? tabs
    : tabs.filter((tab) => tab.id !== "reset");

  return (
    <div className="mb-6 overflow-x-auto border-b border-slate-200">
      <div className="flex min-w-max gap-1" role="tablist">
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active === tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition ${
              active === tab.id
                ? "border-blue-600 bg-blue-50 text-blue-700"
                : "border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ResetCompanyDataPanel({
  companyCode,
  busy,
  confirmation,
  ownerPassword,
  onConfirmationChange,
  onOwnerPasswordChange,
  onReset,
}: {
  companyCode: string;
  busy: boolean;
  confirmation: string;
  ownerPassword: string;
  onConfirmationChange: (value: string) => void;
  onOwnerPasswordChange: (value: string) => void;
  onReset: () => void;
}) {
  const resetPhrase = `RESET ${companyCode}`;

  return (
    <section className="rounded-xl border border-red-200 bg-white shadow-sm">
      <div className="border-b border-red-100 bg-red-50 px-6 py-5">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-red-600 p-3 text-white">
            <RotateCcw size={22} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-red-950">
              Reset Database
            </h2>
            <p className="mt-1 text-sm leading-6 text-red-800">
              Clears this company&apos;s operational records and keeps user
              logins, the company profile, and SMTP settings. Only the
              signed-in company owner can run it.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 p-6 md:grid-cols-2">
        <DataScopeList
          title="Deleted"
          tone="red"
          items={[
            "Sales, inventory, procurement, and HR records",
            "Customers, quotations, orders, and invoices",
            "Holidays, attendance, leaves, and expenses",
          ]}
        />
        <DataScopeList
          title="Preserved"
          tone="green"
          items={[
            "Company profile and logos",
            "SMTP configuration",
            "Users, roles, and sessions",
            "License, notifications, and audit history",
          ]}
        />
      </div>

      <div className="border-t border-slate-200 px-6 py-5">
        <div className="max-w-xl">
          <Input
            label="Owner Current Password"
            type="password"
            value={ownerPassword}
            onChange={(event) => onOwnerPasswordChange(event.target.value)}
            autoComplete="current-password"
          />

          <div className="mt-5">
            <Input
              label={`Type ${resetPhrase} to confirm`}
              value={confirmation}
              onChange={(event) => onConfirmationChange(event.target.value)}
              autoComplete="off"
            />
          </div>
        </div>

        <Button
          variant="danger"
          className="mt-5"
          loading={busy}
          disabled={confirmation !== resetPhrase || ownerPassword.length === 0}
          onClick={onReset}
        >
          <RotateCcw size={17} /> Wipe Company Data
        </Button>
      </div>
    </section>
  );
}

function DataScopeList({
  title,
  tone,
  items,
}: {
  title: string;
  tone: "red" | "green";
  items: string[];
}) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        tone === "red"
          ? "border-red-200 bg-red-50"
          : "border-emerald-200 bg-emerald-50"
      }`}
    >
      <h3
        className={`font-semibold ${
          tone === "red" ? "text-red-900" : "text-emerald-900"
        }`}
      >
        {title}
      </h3>
      <ul
        className={`mt-3 list-inside list-disc space-y-2 text-sm ${
          tone === "red" ? "text-red-800" : "text-emerald-800"
        }`}
      >
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function Feedback({
  message,
  error,
}: {
  message: string | null;
  error: string | null;
}) {
  return (
    <>
      {message ? (
        <div className="mb-6 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
    </>
  );
}

function LogoCard({
  title,
  preset,
  description,
  value,
  fileName,
  busy,
  disabled,
  onUpload,
  onRemove,
}: {
  title: string;
  preset: ImageUploadPreset;
  description: string;
  value: string | null;
  fileName: string | null;
  busy: boolean;
  disabled: boolean;
  onUpload: (file: File) => Promise<void>;
  onRemove: () => Promise<void>;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="font-semibold text-slate-900">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
      <div className="mt-5">
        <ImageUploader
          preset={preset}
          value={value}
          uploading={busy}
          removing={busy}
          disabled={disabled}
          onUpload={onUpload}
          onRemove={onRemove}
        />
      </div>
      {fileName ? (
        <p className="mt-4 text-xs text-slate-500">Stored file: {fileName}</p>
      ) : null}
    </div>
  );
}

function TextareaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </span>
      <textarea
        rows={3}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </label>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-60 items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-blue-600 border-r-transparent" />
        <p className="mt-4 text-sm text-slate-500">
          Loading company settings...
        </p>
      </div>
    </div>
  );
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
