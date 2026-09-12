"use client";

import { ExternalLink, Handshake, Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";

import { AuthenticatedImage } from "@/components/media/authenticated-image";
import {
  Button,
  Card,
  CardContent,
  ConfirmDialog,
  Input,
  Modal,
  Spinner,
} from "@/components/ui";
import { employeeFullName, getEmployeeDirectory } from "@/lib/employees";
import { canManagePartners } from "@/lib/hr-access";
import {
  createPartner,
  deletePartner,
  getPartners,
  updatePartner,
  uploadPartnerLogo,
} from "@/lib/partners";
import type { EmployeeDirectoryItem } from "@/types/employee";
import type { Partner, PartnerInput } from "@/types/partner";

export default function PartnersPage() {
  const [manage, setManage] = useState(false);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [directory, setDirectory] = useState<EmployeeDirectoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState<Partner | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Partner | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setManage(canManagePartners());
  }, []);

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

  async function handleSubmit(payload: PartnerInput, logo?: File | null) {
    setSubmitting(true);
    setError(null);

    try {
      const saved = selected
        ? await updatePartner(selected.id, payload)
        : await createPartner(payload);

      if (logo) {
        await uploadPartnerLogo(saved.id, logo);
      }

      setFormOpen(false);
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
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Handshake size={20} />
          </div>
          <div>
            <p className="text-sm font-medium text-blue-600">HR & Operations</p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Partner Management
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Track vendor portals and assigned relationship owners.
            </p>
          </div>
        </div>

        {manage ? (
          <Button
            onClick={() => {
              setSelected(null);
              setFormOpen(true);
            }}
          >
            <Plus size={17} />
            Add Partner
          </Button>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading && partners.length === 0 ? (
        <div className="flex min-h-72 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <Spinner />
        </div>
      ) : partners.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center text-sm text-slate-500">
          No partners have been added yet.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {partners.map((partner) => (
            <Card key={partner.id}>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                    {partner.logoUrl ? (
                      <AuthenticatedImage
                        src={partner.logoUrl}
                        alt={partner.name}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <Handshake size={20} className="text-slate-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold text-slate-900">
                      {partner.name}
                    </h2>
                    <div className="mt-1 flex flex-wrap gap-3 text-sm">
                      {partner.portalUrl ? (
                        <a
                          href={partner.portalUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-medium text-blue-600 hover:underline"
                        >
                          Portal
                          <ExternalLink size={13} />
                        </a>
                      ) : null}
                      {partner.websiteUrl ? (
                        <a
                          href={partner.websiteUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-medium text-blue-600 hover:underline"
                        >
                          Website
                          <ExternalLink size={13} />
                        </a>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Assigned Employees
                  </p>
                  <p className="mt-1 text-sm text-slate-700">
                    {partner.assignedEmployees.length === 0
                      ? "None assigned"
                      : partner.assignedEmployees
                          .map((employee) => employeeFullName(employee))
                          .join(", ")}
                  </p>
                </div>

                {manage ? (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelected(partner);
                        setFormOpen(true);
                      }}
                    >
                      <Pencil size={14} />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => setDeleteTarget(partner)}
                    >
                      <Trash2 size={14} />
                      Delete
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <PartnerFormModal
        open={formOpen}
        partner={selected}
        directory={directory}
        loading={submitting}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete Partner"
        description="This partner and its assignments will be removed."
        confirmLabel="Delete Partner"
        destructive
        loading={submitting}
        onConfirm={() => void handleDelete()}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function PartnerFormModal({
  open,
  partner,
  directory,
  loading,
  onClose,
  onSubmit,
}: {
  open: boolean;
  partner: Partner | null;
  directory: EmployeeDirectoryItem[];
  loading: boolean;
  onClose: () => void;
  onSubmit: (payload: PartnerInput, logo?: File | null) => void;
}) {
  const [name, setName] = useState("");
  const [portalUrl, setPortalUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [employeeIds, setEmployeeIds] = useState<string[]>([]);
  const [logo, setLogo] = useState<File | null>(null);

  useEffect(() => {
    setName(partner?.name ?? "");
    setPortalUrl(partner?.portalUrl ?? "");
    setWebsiteUrl(partner?.websiteUrl ?? "");
    setEmployeeIds(partner?.assignedEmployees.map((item) => item.id) ?? []);
    setLogo(null);
  }, [open, partner]);

  function toggleEmployee(id: string) {
    setEmployeeIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
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

  return (
    <Modal
      open={open}
      title={partner ? "Edit Partner" : "Add Partner"}
      onClose={onClose}
      className="max-w-xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" form="partner-form" loading={loading}>
            Save Partner
          </Button>
        </>
      }
    >
      <form id="partner-form" className="space-y-4" onSubmit={handleSubmit}>
        <Input
          label="Name"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <Input
          label="Portal URL"
          value={portalUrl}
          onChange={(event) => setPortalUrl(event.target.value)}
          placeholder="https://"
        />
        <Input
          label="Website URL"
          value={websiteUrl}
          onChange={(event) => setWebsiteUrl(event.target.value)}
          placeholder="https://"
        />
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">
            Logo
          </span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) => setLogo(event.target.files?.[0] ?? null)}
            className="block w-full text-sm text-slate-600"
          />
        </label>
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-slate-700">
            Assigned Employees
          </legend>
          <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-3">
            {directory.length === 0 ? (
              <p className="text-sm text-slate-500">No employees in the directory.</p>
            ) : (
              directory.map((employee) => (
                <label key={employee.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={employeeIds.includes(employee.id)}
                    onChange={() => toggleEmployee(employee.id)}
                  />
                  {employeeFullName(employee)}
                </label>
              ))
            )}
          </div>
        </fieldset>
      </form>
    </Modal>
  );
}
