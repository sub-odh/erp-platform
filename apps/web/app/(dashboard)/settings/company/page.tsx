"use client";

import {
  Building2,
  Database,
  Download,
  Info,
  RotateCcw,
  Save,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";

import { ImageUploader } from "@/components/media";
import { Button, Input } from "@/components/ui";
import { getStoredUser } from "@/lib/auth";
import {
  getCompanyBackup,
  getCurrentCompany,
  removeInvoiceLogo,
  removeCompanyLogo,
  resetCompanyData,
  resolveMediaUrl,
  restoreCompanyBackup,
  updateCurrentCompany,
  uploadInvoiceLogo,
  uploadCompanyLogo,
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
  currencyCode: "USD",
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
  const [backupBusy, setBackupBusy] = useState(false);
  const [restoreBusy, setRestoreBusy] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restoreConfirmation, setRestoreConfirmation] = useState("");
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

  async function handleDownloadBackup(): Promise<void> {
    setBackupBusy(true);
    setMessage(null);
    setError(null);

    try {
      const backup = await getCompanyBackup();
      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const date = backup.exportedAt.slice(0, 10);
      link.href = url;
      link.download = `${company.code.toLowerCase()}-company-backup-${date}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setMessage("Company backup downloaded successfully.");
    } catch (requestError) {
      setError(errorMessage(requestError, "Unable to create company backup."));
    } finally {
      setBackupBusy(false);
    }
  }

  async function handleRestore(): Promise<void> {
    if (!restoreFile) {
      setError("Select a company backup JSON file first.");
      return;
    }

    setRestoreBusy(true);
    setMessage(null);
    setError(null);

    try {
      const result = await restoreCompanyBackup(
        restoreFile,
        restoreConfirmation,
      );
      setMessage(result.message);
      setRestoreFile(null);
      setRestoreConfirmation("");
    } catch (requestError) {
      setError(errorMessage(requestError, "Unable to restore company data."));
    } finally {
      setRestoreBusy(false);
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

  const busy = saving || logoBusy || invoiceLogoBusy;

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
          <section className="grid gap-6 lg:grid-cols-2">
            <LogoCard
              title="System logo (main)"
              description="Shown in the navigation and main application shell."
              value={resolveMediaUrl(company.logoUrl)}
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
              title="Invoice logo (light background)"
              description="Used on invoices, delivery orders, and other print documents."
              value={resolveMediaUrl(company.invoiceLogoUrl)}
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
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Company information
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Configure the details shown on documents, orders, and invoices.
            </p>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <Input
                label="Company name"
                value={company.name}
                onChange={(event) => updateField("name", event.target.value)}
                required
              />

              <Input label="Company code" value={company.code} disabled />

              <Input
                label="Legal name"
                value={company.legalName ?? ""}
                onChange={(event) =>
                  updateField("legalName", event.target.value)
                }
              />

              <Input
                label="Email address"
                type="email"
                value={company.email ?? ""}
                onChange={(event) => updateField("email", event.target.value)}
              />

              <Input
                label="Contact number"
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
                label="Registration number"
                value={company.registrationNumber ?? ""}
                onChange={(event) =>
                  updateField("registrationNumber", event.target.value)
                }
              />

              <Input
                label="Registration date"
                type="date"
                value={company.registrationDate ?? ""}
                onChange={(event) =>
                  updateField("registrationDate", event.target.value)
                }
              />

              <div className="hidden md:block" />

              <div className="md:col-span-2">
                <TextareaField
                  label="Office address"
                  value={company.addressLine1 ?? ""}
                  onChange={(value) => updateField("addressLine1", value)}
                />
              </div>

              <Input
                label="Address line 2"
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
                label="Postal code"
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
                label="Office time starts"
                type="time"
                value={company.officeStartTime ?? ""}
                onChange={(event) =>
                  updateField("officeStartTime", event.target.value)
                }
              />

              <Input
                label="Office time ends"
                type="time"
                value={company.officeEndTime ?? ""}
                onChange={(event) =>
                  updateField("officeEndTime", event.target.value)
                }
              />

              <Input
                label="Currency code"
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
        <BackupRestorePanel
          company={company}
          backupBusy={backupBusy}
          restoreBusy={restoreBusy}
          restoreFile={restoreFile}
          confirmation={restoreConfirmation}
          onDownload={() => void handleDownloadBackup()}
          onFileChange={setRestoreFile}
          onConfirmationChange={setRestoreConfirmation}
          onRestore={() => void handleRestore()}
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

function BackupRestorePanel({
  company,
  backupBusy,
  restoreBusy,
  restoreFile,
  confirmation,
  onDownload,
  onFileChange,
  onConfirmationChange,
  onRestore,
}: {
  company: Company;
  backupBusy: boolean;
  restoreBusy: boolean;
  restoreFile: File | null;
  confirmation: string;
  onDownload: () => void;
  onFileChange: (file: File | null) => void;
  onConfirmationChange: (value: string) => void;
  onRestore: () => void;
}) {
  const restorePhrase = `RESTORE ${company.code}`;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-blue-100 p-3 text-blue-700">
            <Download size={22} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Download company backup
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Export customers, contacts, leads, opportunities, and pipeline
              stages for {company.name} only.
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <div className="flex gap-2 font-medium">
            <ShieldCheck size={18} /> Company-scoped and portable
          </div>
          <p className="mt-2 leading-6">
            The JSON backup is tagged with company ID {company.code} and can
            only be restored to this same company.
          </p>
        </div>

        <Button
          className="mt-6 w-full sm:w-auto"
          loading={backupBusy}
          onClick={onDownload}
        >
          <Download size={17} /> Download backup
        </Button>
      </section>

      <section className="rounded-xl border border-amber-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-amber-100 p-3 text-amber-700">
            <Upload size={22} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Restore company backup
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Replaces this company&apos;s current Sales/CRM records with the
              selected backup. Take a fresh backup first.
            </p>
          </div>
        </div>

        <label className="mt-6 block">
          <span className="mb-2 block text-sm font-medium text-slate-700">
            Company backup file
          </span>
          <input
            key={restoreFile?.name ?? "no-backup-selected"}
            type="file"
            accept=".json,application/json"
            onChange={(event) =>
              onFileChange(event.target.files?.item(0) ?? null)
            }
            className="block w-full rounded-lg border border-slate-300 bg-white text-sm text-slate-600 file:mr-4 file:border-0 file:border-r file:border-slate-200 file:bg-slate-50 file:px-4 file:py-3 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-100"
          />
        </label>

        <div className="mt-5">
          <Input
            label={`Type ${restorePhrase} to confirm`}
            value={confirmation}
            onChange={(event) => onConfirmationChange(event.target.value)}
            autoComplete="off"
          />
        </div>

        <Button
          variant="danger"
          className="mt-6 w-full sm:w-auto"
          loading={restoreBusy}
          disabled={!restoreFile || confirmation !== restorePhrase}
          onClick={onRestore}
        >
          <Upload size={17} /> Restore backup
        </Button>
      </section>
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
              Reset company operational data
            </h2>
            <p className="mt-1 text-sm leading-6 text-red-800">
              Only the signed-in company owner can perform this action. It
              permanently removes Sales/CRM data belonging to company
              {` ${companyCode}`} only.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 p-6 md:grid-cols-2">
        <DataScopeList
          title="Deleted"
          tone="red"
          items={[
            "Customers and contacts",
            "Leads and opportunities",
            "Pipeline stages",
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
            label="Owner current password"
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
          <RotateCcw size={17} /> Reset company data
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
  description,
  value,
  fileName,
  busy,
  disabled,
  onUpload,
  onRemove,
}: {
  title: string;
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
          preset="companyLogo"
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
