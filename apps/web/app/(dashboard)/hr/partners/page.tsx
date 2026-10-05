"use client";

import { Globe, Handshake, List, Lock, Pencil, Plus, PlusCircle, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";

import { useAuthenticatedMediaUrl } from "@/lib/media";
import { employeeFullName, getEmployeeDirectory } from "@/lib/employees";
import {
  createPartner,
  deletePartner,
  getPartners,
  updatePartner,
  uploadPartnerLogo,
} from "@/lib/partners";
import type { EmployeeDirectoryItem } from "@/types/employee";
import type { Partner, PartnerInput } from "@/types/partner";

type Flash = { tone: "success" | "warning" | "info"; text: string } | null;

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [directory, setDirectory] = useState<EmployeeDirectoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<Flash>(null);
  const [selected, setSelected] = useState<Partner | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Partner | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [rows, employees] = await Promise.all([
        getPartners(),
        getEmployeeDirectory().catch(() => []),
      ]);
      setPartners(rows);
      setDirectory(employees);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load partners.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const employees = useMemo(
    () =>
      directory
        .filter((employee) => employee.status === "ACTIVE")
        .sort((left, right) => left.firstName.localeCompare(right.firstName)),
    [directory],
  );

  async function handleCreate(payload: PartnerInput, logo?: File | null) {
    setSubmitting(true);
    setError(null);

    try {
      const saved = await createPartner(payload);

      if (logo) {
        await uploadPartnerLogo(saved.id, logo);
      }

      setFlash({ tone: "success", text: "Partner added successfully." });
      setFormKey((value) => value + 1);
      await load();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save the partner.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEdit(payload: PartnerInput, logo?: File | null) {
    if (!selected) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const saved = await updatePartner(selected.id, payload);

      if (logo) {
        await uploadPartnerLogo(saved.id, logo);
      }

      setSelected(null);
      setFlash({ tone: "info", text: "Partner updated successfully." });
      await load();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save the partner.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await deletePartner(deleteTarget.id);
      setDeleteTarget(null);
      setFlash({ tone: "warning", text: "Partner deleted successfully." });
      await load();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete the partner.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="mb-4">
        <div className="text-base font-bold tracking-tight text-[#1e293b]">
          <Handshake size={16} className="mr-2 inline text-[#0d6efd]" />
          Partner Entry Portal
        </div>
        <div className="mt-0.5 text-[0.72rem] text-[#94a3b8]">
          Admin · Vendor & Partner Management
        </div>
      </div>

      {flash ? <FlashBanner flash={flash} /> : null}
      {error ? (
        <div className="mb-3 rounded-xl border-0 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid items-start gap-3 xl:grid-cols-12">
        <section className="overflow-hidden rounded-[14px] border border-[#e8ecf4] bg-white shadow-sm xl:col-span-4">
          <div className="border-b border-[#f1f5f9] px-5 py-3.5">
            <h2 className="text-[0.8rem] font-bold text-[#1e293b]">
              <PlusCircle size={14} className="mr-2 inline text-slate-400" />
              New Vendor Details
            </h2>
          </div>
          <div className="p-4">
            <PartnerFields
              key={formKey}
              employees={employees}
              submitting={submitting}
              submitLabel="Create Partner"
              onSubmit={handleCreate}
            />
          </div>
        </section>

        <section className="overflow-hidden rounded-[14px] border border-[#e8ecf4] bg-white shadow-sm xl:col-span-8">
          <div className="flex items-center justify-between border-b border-[#f1f5f9] px-5 py-3.5">
            <h2 className="text-[0.8rem] font-bold text-[#1e293b]">
              <List size={14} className="mr-2 inline text-slate-400" />
              Current Vendors & Visibility
            </h2>
            <span className="rounded border border-slate-200 bg-[#f8f9fa] px-2 py-0.5 text-[0.65rem] text-slate-500">
              {partners.length} Partners
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {["Partner", "Access", "Assigned To", "Action"].map((label, index) => (
                    <th
                      key={label}
                      className={`whitespace-nowrap border-b border-[#f1f5f9] bg-[#f8fafc] px-4 py-2.5 text-left text-[0.6rem] font-bold uppercase tracking-wide text-[#94a3b8] ${index === 0 ? "pl-5" : ""} ${index === 3 ? "pr-5 text-right" : ""}`}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {!loading && partners.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-[0.78rem] text-[#94a3b8]">
                      <Handshake size={28} className="mx-auto mb-2 opacity-25" />
                      No partners added yet.
                    </td>
                  </tr>
                ) : (
                  partners.map((partner) => (
                    <tr key={partner.id} className="border-b border-[#f8fafc] hover:bg-[#f8fafc]">
                      <td className="px-4 py-3 pl-5">
                        <div className="flex items-center gap-2">
                          <PartnerLogo partner={partner} />
                          <span className="text-[0.82rem] font-bold text-[#1e293b]">
                            {partner.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <AccessLink href={partner.portalUrl} title="Partner Portal" kind="portal" />
                          <AccessLink href={partner.websiteUrl} title="Website" kind="site" />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div
                          className="max-w-[160px] truncate text-[0.7rem] text-[#64748b]"
                          title={assignedNames(partner)}
                        >
                          {partner.assignedEmployees.length === 0 ? (
                            <em className="text-slate-400">No one</em>
                          ) : (
                            assignedNames(partner)
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 pr-5">
                        <div className="flex items-center justify-end">
                          <button
                            type="button"
                            title="Edit"
                            className="ml-2 text-[#94a3b8] hover:text-[#3b82f6]"
                            onClick={() => setSelected(partner)}
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            type="button"
                            title="Delete"
                            className="ml-2 text-[#94a3b8] hover:text-[#ef4444]"
                            onClick={() => setDeleteTarget(partner)}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {selected ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-[14px] bg-white shadow-lg">
            <div className="flex items-center justify-between px-4 pt-4">
              <h2 className="text-[0.9rem] font-bold">Edit Partner Details</h2>
              <button type="button" onClick={() => setSelected(null)} aria-label="Close">
                <X size={16} />
              </button>
            </div>
            <div className="p-4">
              <PartnerFields
                partner={selected}
                employees={employees}
                submitting={submitting}
                submitLabel="Save Changes"
                onCancel={() => setSelected(null)}
                onSubmit={handleEdit}
              />
            </div>
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-[14px] bg-white p-5 shadow-lg">
            <h2 className="text-lg font-bold">Delete this partner?</h2>
            <p className="mt-2 text-sm text-slate-600">{deleteTarget.name}</p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="rounded bg-[#f8f9fa] px-3 py-1 text-sm"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                className="rounded bg-[#dc3545] px-3 py-1 text-sm text-white disabled:opacity-60"
                onClick={() => void handleDelete()}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PartnerFields({
  partner,
  employees,
  submitting,
  submitLabel,
  onCancel,
  onSubmit,
}: {
  partner?: Partner;
  employees: EmployeeDirectoryItem[];
  submitting: boolean;
  submitLabel: string;
  onCancel?: () => void;
  onSubmit: (payload: PartnerInput, logo?: File | null) => void;
}) {
  const [name, setName] = useState(partner?.name ?? "");
  const [portalUrl, setPortalUrl] = useState(partner?.portalUrl ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(partner?.websiteUrl ?? "");
  const [employeeIds, setEmployeeIds] = useState<string[]>(
    partner?.assignedEmployees.map((employee) => employee.id) ?? [],
  );
  const [logo, setLogo] = useState<File | null>(null);

  function toggle(id: string) {
    setEmployeeIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit(
      {
        name: name.trim(),
        portalUrl: portalUrl.trim() || null,
        websiteUrl: websiteUrl.trim() || null,
        employeeIds,
      },
      logo,
    );
  }

  const createMode = !partner;

  return (
    <form onSubmit={handleSubmit}>
      <Field label="Vendor Name">
        <input
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={createMode ? "e.g. Cisco" : undefined}
          className={inputClass}
        />
      </Field>
      <div className="mb-3 grid grid-cols-2 gap-2">
        <Field label="Portal URL">
          <input
            type="url"
            value={portalUrl}
            onChange={(event) => setPortalUrl(event.target.value)}
            placeholder={createMode ? "Login link" : undefined}
            className={inputClass}
          />
        </Field>
        <Field label="Website">
          <input
            type="url"
            value={websiteUrl}
            onChange={(event) => setWebsiteUrl(event.target.value)}
            placeholder={createMode ? "Public site" : undefined}
            className={inputClass}
          />
        </Field>
      </div>
      <Field
        label={
          createMode
            ? "Logo (optional)"
            : "Change Logo (Leave empty to keep current)"
        }
      >
        <input
          type="file"
          accept="image/*"
          onChange={(event) => setLogo(event.target.files?.[0] ?? null)}
          className={inputClass}
        />
      </Field>
      <div className={createMode ? "mb-4" : "mb-3"}>
        <span className={labelClass}>{createMode ? "Assign to Employees" : "Update Assignees"}</span>
        <div className="h-[150px] overflow-y-auto rounded-lg border-[1.5px] border-[#e8ecf4] bg-[#f8fafc] px-3 py-2">
          {employees.map((employee) => (
            <label key={employee.id} className="mb-1 flex items-center gap-2 text-[0.78rem] text-[#334155]">
              <input
                type="checkbox"
                checked={employeeIds.includes(employee.id)}
                onChange={() => toggle(employee.id)}
              />
              {employeeFullName(employee)}
            </label>
          ))}
        </div>
      </div>
      {createMode ? (
        <button
          type="submit"
          disabled={submitting}
          className="w-full cursor-pointer rounded-lg bg-[#1e293b] px-3 py-2 text-[0.78rem] font-bold tracking-wide text-white hover:bg-[#0f172a] disabled:opacity-60"
        >
          <Plus size={14} className="mr-2 inline" />
          {submitLabel}
        </button>
      ) : (
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="rounded px-3 py-1 text-sm font-bold text-slate-500"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-[#0d6efd] px-4 py-1 text-sm font-bold text-white disabled:opacity-60"
          >
            {submitLabel}
          </button>
        </div>
      )}
    </form>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  const optional = label.includes("(optional)");
  const keep = label.includes("Leave empty");

  return (
    <label className="mb-3 block">
      <span className={labelClass}>
        {optional ? (
          <>
            Logo <span className="font-normal normal-case text-[#cbd5e1]">(optional)</span>
          </>
        ) : keep ? (
          <>
            Change Logo{" "}
            <span className="font-normal normal-case">(Leave empty to keep current)</span>
          </>
        ) : (
          label
        )}
      </span>
      {children}
    </label>
  );
}

function PartnerLogo({ partner }: { partner: Partner }) {
  const url = useAuthenticatedMediaUrl(partner.logoUrl);

  if (!url) {
    return <span className="h-[30px] w-[30px] shrink-0 rounded-md border border-[#e8ecf4] bg-[#f1f5f9]" />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt="logo"
      className="h-[30px] w-[30px] shrink-0 rounded-md border border-[#e8ecf4] bg-[#f1f5f9] object-contain p-0.5"
    />
  );
}

function AccessLink({
  href,
  title,
  kind,
}: {
  href: string | null;
  title: string;
  kind: "portal" | "site";
}) {
  const className =
    "inline-flex h-[26px] w-[26px] items-center justify-center rounded-md border border-[#e8ecf4] bg-white text-[#64748b] hover:border-[#bfdbfe] hover:bg-[#eff6ff] hover:text-[#2563eb]";
  const siteClass =
    "inline-flex h-[26px] w-[26px] items-center justify-center rounded-md border border-[#e8ecf4] bg-white text-[#64748b] hover:border-[#bbf7d0] hover:bg-[#f0fdf4] hover:text-[#16a34a]";
  const icon = kind === "portal" ? <Lock size={12} /> : <Globe size={12} />;

  if (!href) {
    return (
      <span className={className} title={title}>
        {icon}
      </span>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      title={title}
      className={kind === "portal" ? className : siteClass}
    >
      {icon}
    </a>
  );
}

function FlashBanner({ flash }: { flash: { tone: "success" | "warning" | "info"; text: string } }) {
  const tone =
    flash.tone === "success"
      ? "bg-[#d1e7dd] text-[#0f5132]"
      : flash.tone === "warning"
        ? "bg-[#fff3cd] text-[#664d03]"
        : "bg-[#cff4fc] text-[#055160]";

  return (
    <div className={`mb-3 rounded-xl px-3 py-2 text-sm ${tone}`}>{flash.text}</div>
  );
}

function assignedNames(partner: Partner): string {
  return partner.assignedEmployees
    .map((employee) => employeeFullName(employee))
    .join(", ");
}

const labelClass =
  "mb-1 block text-[0.62rem] font-bold uppercase tracking-wide text-[#94a3b8]";
const inputClass =
  "w-full rounded-lg border-[1.5px] border-[#e8ecf4] bg-[#f8fafc] px-3 py-[7px] text-[0.82rem] outline-none focus:border-[#3b82f6] focus:bg-white";
