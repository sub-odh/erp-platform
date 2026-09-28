"use client";

import {
  ArrowUpDown,
  CheckCircle2,
  Download,
  Eye,
  FileSpreadsheet,
  History,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

import { AuthenticatedImage } from "@/components/media/authenticated-image";
import { Button, Input, Modal, Spinner } from "@/components/ui";
import { formatCurrency } from "@/lib/currency";
import {
  deleteCustomer,
  downloadCustomerCsvTemplate,
  getCustomers,
  importCustomersCsv,
} from "@/lib/customers";
import { canDeleteClients } from "@/lib/hr-access";
import type { Customer } from "@/types/customer";

type SortKey = "name" | "contact" | "email" | "due" | "history";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function sortValue(customer: Customer, key: SortKey): string | number {
  switch (key) {
    case "contact":
      return (customer.contactPerson ?? "").toLowerCase();
    case "email":
      return (customer.email ?? "").toLowerCase();
    case "due":
      return Number(customer.activeDue);
    case "history":
      return customer.deliveryOrderCount;
    case "name":
    default:
      return customer.name.toLowerCase();
  }
}

export default function ClientsPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortAsc, setSortAsc] = useState(true);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [canDelete, setCanDelete] = useState(false);
  const [details, setDetails] = useState<Customer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setCanDelete(canDeleteClients());
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getCustomers({
        page: 1,
        limit: 200,
        sortBy: "name",
        sortDirection: "asc",
      });
      setCustomers(result.data);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load clients.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = query
      ? customers.filter((customer) =>
          [
            customer.name,
            customer.taxNumber ?? "",
            customer.contactPerson ?? "",
            customer.email ?? "",
            customer.phone ?? "",
          ]
            .join(" ")
            .toLowerCase()
            .includes(query),
        )
      : customers;

    return [...filtered].sort((left, right) => {
      const a = sortValue(left, sortKey);
      const b = sortValue(right, sortKey);
      if (a < b) return sortAsc ? -1 : 1;
      if (a > b) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [customers, search, sortAsc, sortKey]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc((current) => !current);
      return;
    }
    setSortKey(key);
    setSortAsc(true);
  }

  async function handleImport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!csvFile) {
      setError("Choose a CSV file to import.");
      return;
    }

    setImporting(true);
    setError(null);
    setNotice(null);

    try {
      const result = await importCustomersCsv(csvFile);
      setCsvFile(null);
      (event.target as HTMLFormElement).reset();
      setNotice(
        `Imported ${result.imported} client${result.imported === 1 ? "" : "s"}${
          result.skipped ? `, skipped ${result.skipped} duplicate${result.skipped === 1 ? "" : "s"}` : ""
        }.`,
      );
      await load();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to import clients.",
      );
    } finally {
      setImporting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }

    if (!deletePassword.trim()) {
      setDeleteError("Password required");
      return;
    }

    setDeleting(true);
    setDeleteError(null);

    try {
      await deleteCustomer(deleteTarget.id, deletePassword);
      setDeleteTarget(null);
      setDeletePassword("");
      setNotice("Client record deleted successfully.");
      await load();
    } catch (requestError) {
      setDeleteError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete this client.",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-5">
      {canDelete ? (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">
          <CheckCircle2 size={16} />
          SuperAdmin Access Verified. Full management enabled.
        </div>
      ) : (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
          Delete buttons restricted. Super Admin access is required to remove
          clients.
        </div>
      )}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Client Directory</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage customer records and financial status
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative min-w-[260px] flex-1">
            <Search
              size={16}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name or PAN..."
              className="h-11 w-full rounded-full border-0 bg-white px-11 text-sm shadow-sm outline-none ring-1 ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-200"
            />
          </label>
          <Button
            className="rounded-full px-5"
            onClick={() => router.push("/hr/clients/new")}
          >
            <Plus size={16} />
            Add New
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-4 shadow-sm">
        <form
          onSubmit={handleImport}
          className="flex flex-col gap-4 lg:flex-row lg:items-center"
        >
          <div className="min-w-[220px]">
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <FileSpreadsheet size={16} className="text-emerald-600" />
              Bulk Import Clients
            </p>
            <button
              type="button"
              className="mt-1 inline-flex items-center gap-1 text-sm text-emerald-600 hover:underline"
              onClick={() => void downloadCustomerCsvTemplate()}
            >
              <Download size={14} />
              Download CSV Template
            </button>
          </div>
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <input
              type="file"
              accept=".csv"
              onChange={(event) => setCsvFile(event.target.files?.[0] ?? null)}
              className="h-10 w-full rounded-full border border-slate-200 bg-white px-4 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-slate-100 file:px-3 file:py-1 file:text-sm"
            />
            <Button
              type="submit"
              variant="success"
              loading={importing}
              className="rounded-full px-6"
            >
              Upload
            </Button>
          </div>
        </form>
      </div>

      {notice ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm text-emerald-800">
          {notice}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading && customers.length === 0 ? (
        <div className="flex min-h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <Spinner />
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  <SortHeader
                    label="Client Details"
                    active={sortKey === "name"}
                    onClick={() => toggleSort("name")}
                    className="ps-5"
                  />
                  <SortHeader
                    label="Contact"
                    active={sortKey === "contact"}
                    onClick={() => toggleSort("contact")}
                  />
                  <SortHeader
                    label="Email"
                    active={sortKey === "email"}
                    onClick={() => toggleSort("email")}
                  />
                  <SortHeader
                    label="Active Due"
                    active={sortKey === "due"}
                    onClick={() => toggleSort("due")}
                  />
                  <SortHeader
                    label="History"
                    active={sortKey === "history"}
                    onClick={() => toggleSort("history")}
                  />
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-16 text-center text-sm text-slate-500"
                    >
                      No clients match the current search.
                    </td>
                  </tr>
                ) : (
                  rows.map((customer) => (
                    <tr key={customer.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          {customer.logoUrl ? (
                            <AuthenticatedImage
                              src={customer.logoUrl}
                              alt=""
                              className="h-10 w-10 rounded-lg border border-slate-200 bg-white object-contain"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-sm font-bold text-indigo-600">
                              {initials(customer.name) || "C"}
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-semibold text-slate-900">
                              {customer.name}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              PAN: {customer.taxNumber ?? "N/A"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-semibold text-slate-600">
                          {customer.contactPerson ?? "N/A"}
                        </div>
                        <div className="text-xs text-slate-400">
                          {customer.phone ?? ""}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">
                        {customer.email ?? "N/A"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-md border border-rose-100 bg-rose-50 px-2.5 py-1 text-sm font-bold text-rose-600">
                          {formatCurrency(customer.activeDue)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() =>
                            router.push(`/hr/clients/${customer.id}/history`)
                          }
                          className="inline-flex items-center gap-1 rounded-full border border-amber-300 px-3 py-1 text-[11px] font-bold text-amber-700 hover:bg-amber-50"
                        >
                          <History size={12} />
                          {customer.deliveryOrderCount}
                        </button>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                          <button
                            type="button"
                            title="View"
                            className="p-2 text-blue-600 hover:bg-slate-50"
                            onClick={() => setDetails(customer)}
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            type="button"
                            title="Edit"
                            className="border-l border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
                            onClick={() =>
                              router.push(`/hr/clients/${customer.id}/edit`)
                            }
                          >
                            <Pencil size={15} />
                          </button>
                          {canDelete ? (
                            <button
                              type="button"
                              title="Delete"
                              className="border-l border-slate-200 p-2 text-rose-600 hover:bg-rose-50"
                              onClick={() => {
                                setDeleteTarget(customer);
                                setDeletePassword("");
                                setDeleteError(null);
                              }}
                            >
                              <Trash2 size={15} />
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={Boolean(details)}
        title={details?.name ?? "Client Details"}
        onClose={() => setDetails(null)}
      >
        {details ? (
          <div className="space-y-5 text-center">
            <div className="flex justify-center">
              {details.logoUrl ? (
                <AuthenticatedImage
                  src={details.logoUrl}
                  alt=""
                  className="h-20 w-20 rounded-xl border border-slate-200 object-contain"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-indigo-50 text-2xl font-bold text-indigo-600">
                  {initials(details.name) || "C"}
                </div>
              )}
            </div>
            <p className="text-sm text-slate-500">
              {details.address ?? details.billingAddressLine1 ?? "N/A"}
            </p>
            <div className="grid grid-cols-2 gap-4 text-left text-sm">
              <div className="text-slate-500">
                Primary Contact
                <div className="font-semibold text-slate-900">
                  {details.contactPerson ?? "N/A"}
                </div>
              </div>
              <div className="text-slate-500">
                Phone
                <div className="font-semibold text-slate-900">
                  {details.phone ?? "N/A"}
                </div>
              </div>
              <div className="text-slate-500">
                Email
                <div className="font-semibold text-slate-900">
                  {details.email ?? "N/A"}
                </div>
              </div>
              <div className="text-slate-500">
                PAN
                <div className="font-semibold text-slate-900">
                  {details.taxNumber ?? "N/A"}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(deleteTarget)}
        title="Confirm Deletion"
        onClose={() => {
          if (!deleting) {
            setDeleteTarget(null);
          }
        }}
        className="max-w-sm"
        footer={
          <>
            <Button
              variant="outline"
              className="rounded-full"
              disabled={deleting}
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              className="rounded-full"
              loading={deleting}
              onClick={() => void handleDelete()}
            >
              Confirm Delete
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-center">
          <p className="text-sm text-slate-600">
            Delete <span className="font-semibold">{deleteTarget?.name}</span>?
          </p>
          <Input
            label="Verify Password"
            type="password"
            value={deletePassword}
            onChange={(event) => setDeletePassword(event.target.value)}
            placeholder="Enter your password"
            error={deleteError ?? undefined}
          />
        </div>
      </Modal>
    </div>
  );
}

function SortHeader({
  label,
  active,
  onClick,
  className,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <th className={className ?? "px-4 py-3"}>
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-1 uppercase"
      >
        {label}
        <ArrowUpDown
          size={11}
          className={active ? "text-blue-500" : "text-slate-300"}
        />
      </button>
    </th>
  );
}
