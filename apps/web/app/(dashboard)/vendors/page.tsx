"use client";

import {
  Building2,
  Mail,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";

import { VendorModal } from "@/components/master-data/vendor-modal";
import { Button, Select, Spinner } from "@/components/ui";
import { archiveVendor, getVendors } from "@/lib/master-data";
import type { PaginationMeta, Vendor } from "@/types/master-data";

const PAGE_SIZE = 20;

export default function VendorsPage() {
  const [records, setRecords] = useState<Vendor[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | "active" | "inactive">("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Vendor | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getVendors({
        search: search || undefined,
        isActive:
          status === "active"
            ? true
            : status === "inactive"
              ? false
              : undefined,
        page,
        limit: PAGE_SIZE,
      });
      setRecords(result.data);
      setPagination(result.pagination);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load vendors.",
      );
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => void load(), [load]);

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  async function archive(record: Vendor) {
    if (
      !window.confirm(
        `Archive ${record.name}? Existing records will be retained.`,
      )
    )
      return;
    setBusyId(record.id);
    setError(null);
    try {
      await archiveVendor(record.id);
      await load();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to archive vendor.",
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div className="flex items-center gap-3">
          <span className="rounded-xl bg-blue-100 p-2.5 text-blue-600">
            <Building2 size={22} />
          </span>
          <div>
            <h1 className="text-2xl font-semibold text-[#16266b]">Vendors</h1>
            <p className="mt-1 text-sm text-slate-500">
              Company-wide supplier directory and purchasing terms.
            </p>
          </div>
        </div>
        <Button
          className="rounded-full px-5"
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          <Plus size={17} /> Register Vendor
        </Button>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-[0_16px_40px_rgba(15,23,42,0.08)] sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-[#16266b]">
          {pagination?.total ?? 0} vendors
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <form onSubmit={submitSearch} className="relative min-w-64">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search vendor, contact, PAN..."
              className="h-10 w-full rounded-full border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-blue-500"
            />
          </form>
          <Select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as typeof status);
              setPage(1);
            }}
            className="min-w-36 rounded-full py-2"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_18px_48px_rgba(15,23,42,0.10)]">
        {loading ? (
          <div className="flex min-h-60 items-center justify-center">
            <Spinner />
          </div>
        ) : (
          <div className="overflow-x-auto p-5">
            <table className="w-full min-w-[950px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wide text-[#9aa7d3]">
                  <th className="px-4 py-4">S.No.</th>
                  <th className="px-4 py-4">Vendor</th>
                  <th className="px-4 py-4">Contact</th>
                  <th className="px-4 py-4">VAT / PAN</th>
                  <th className="px-4 py-4">Terms</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="h-32 text-center text-slate-400">
                      No vendors available
                    </td>
                  </tr>
                ) : (
                  records.map((record, index) => (
                    <tr
                      key={record.id}
                      className="border-b border-slate-100 text-slate-700 hover:bg-slate-50/70"
                    >
                      <td className="px-4 py-4">
                        {(page - 1) * PAGE_SIZE + index + 1}
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-semibold text-[#16266b]">
                          {record.name}
                        </p>
                        <p className="mt-1 font-mono text-xs text-blue-600">
                          {record.code}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <p>{record.contactPerson ?? "—"}</p>
                        {record.email ? (
                          <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                            <Mail size={12} /> {record.email}
                          </p>
                        ) : null}
                        {record.phone ? (
                          <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                            <Phone size={12} /> {record.phone}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-4">{record.taxNumber ?? "—"}</td>
                      <td className="px-4 py-4">
                        {record.paymentTermsDays === 0
                          ? "Immediate"
                          : `${record.paymentTermsDays} days`}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${record.isActive ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-slate-100 text-slate-600 ring-slate-200"}`}
                        >
                          {record.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            title="Edit vendor"
                            onClick={() => {
                              setEditing(record);
                              setModalOpen(true);
                            }}
                          >
                            <Pencil size={16} />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            title="Archive vendor"
                            disabled={busyId === record.id}
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => void archive(record)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {(pagination?.totalPages ?? 0) > 1 ? (
        <div className="flex items-center justify-end gap-3 text-sm text-slate-500">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage((current) => current - 1)}
          >
            Previous
          </Button>
          <span>
            Page {page} of {pagination?.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= (pagination?.totalPages ?? 1) || loading}
            onClick={() => setPage((current) => current + 1)}
          >
            Next
          </Button>
        </div>
      ) : null}

      <VendorModal
        open={modalOpen}
        vendor={editing}
        onClose={() => setModalOpen(false)}
        onSaved={() => void load()}
      />
    </div>
  );
}
