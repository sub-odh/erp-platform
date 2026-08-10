"use client";

import { Plus, RefreshCw, Search } from "lucide-react";

import { useCallback, useEffect, useState, type FormEvent } from "react";

import { Button, ConfirmDialog, Select, Spinner } from "@/components/ui";

import { LeadModal } from "@/components/leads/lead-modal";
import { LeadTable } from "@/components/leads/lead-table";

import { archiveLead, getLeads } from "@/lib/leads";

import type { EditableLeadStatus, Lead, LeadPagination } from "@/types/lead";

const PAGE_SIZE = 20;

type StatusFilter = "ALL" | EditableLeadStatus;

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);

  const [pagination, setPagination] = useState<LeadPagination | null>(null);

  const [loading, setLoading] = useState(true);

  const [searchInput, setSearchInput] = useState("");

  const [search, setSearch] = useState("");

  const [status, setStatus] = useState<StatusFilter>("ALL");

  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);

  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  const [archiveTarget, setArchiveTarget] = useState<Lead | null>(null);

  const [archiving, setArchiving] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const loadLeads = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const result = await getLeads({
        search: search || undefined,

        status: status === "ALL" ? undefined : status,

        page,

        limit: PAGE_SIZE,

        sortBy: "createdAt",

        sortDirection: "desc",
      });

      setLeads(result.data);

      setPagination(result.pagination);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load leads.",
      );
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    void loadLeads();
  }, [loadLeads]);

  function handleSearch(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    setPage(1);

    setSearch(searchInput.trim());
  }

  function openCreate(): void {
    setEditingLead(null);
    setModalOpen(true);
  }

  function openEdit(lead: Lead): void {
    setEditingLead(lead);
    setModalOpen(true);
  }

  function handleSaved(lead: Lead): void {
    setModalOpen(false);
    setEditingLead(null);

    setLeads((current) => {
      const exists = current.some((item) => item.id === lead.id);

      if (exists) {
        return current.map((item) => (item.id === lead.id ? lead : item));
      }

      return [lead, ...current];
    });

    void loadLeads();
  }

  async function confirmArchive(): Promise<void> {
    if (!archiveTarget) {
      return;
    }

    setArchiving(true);

    try {
      await archiveLead(archiveTarget.id);

      setArchiveTarget(null);

      await loadLeads();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to archive lead.",
      );
    } finally {
      setArchiving(false);
    }
  }

  const total = pagination?.total ?? 0;

  const totalPages = pagination?.totalPages ?? 1;

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Sales Pipeline
            </h1>

            <p className="mt-1 text-sm text-slate-600">
              Track leads and manage business deals.
            </p>
          </div>

          <Button onClick={openCreate}>
            <Plus size={18} />
            Add New Lead
          </Button>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:flex-row">
          <form onSubmit={handleSearch} className="flex min-w-0 flex-1">
            <div className="relative flex-1">
              <Search
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search leads by company, contact, email or phone..."
                className="h-10 w-full rounded-l-lg border border-slate-300 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <Button type="submit" className="rounded-l-none">
              Search
            </Button>
          </form>

          <div className="w-full md:w-48">
            <Select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as StatusFilter);

                setPage(1);
              }}
            >
              <option value="ALL">All statuses</option>

              <option value="NEW">New</option>

              <option value="CONTACTED">Contacted</option>

              <option value="QUALIFIED">Qualified</option>

              <option value="DISQUALIFIED">Disqualified</option>
            </Select>
          </div>

          <Button
            variant="outline"
            disabled={loading}
            onClick={() => void loadLeads()}
          >
            <RefreshCw
              size={17}
              className={loading ? "animate-spin" : undefined}
            />
            Refresh
          </Button>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          {loading && leads.length === 0 ? (
            <div className="flex min-h-64 items-center justify-center">
              <Spinner />
            </div>
          ) : (
            <LeadTable
              leads={leads}
              onEdit={openEdit}
              onArchive={setArchiveTarget}
            />
          )}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            {total} {total === 1 ? "lead" : "leads"}
          </p>

          {totalPages > 1 ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                disabled={page <= 1 || loading}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Previous
              </Button>

              <span className="text-sm text-slate-600">
                Page {page} of {totalPages}
              </span>

              <Button
                variant="outline"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      <LeadModal
        open={modalOpen}
        lead={editingLead}
        onClose={() => {
          setModalOpen(false);

          setEditingLead(null);
        }}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={Boolean(archiveTarget)}
        title="Archive lead"
        description={
          archiveTarget
            ? `Archive ${archiveTarget.firstName} ${archiveTarget.lastName}?`
            : ""
        }
        confirmLabel="Archive lead"
        destructive
        loading={archiving}
        onClose={() => setArchiveTarget(null)}
        onConfirm={() => void confirmArchive()}
      />
    </>
  );
}
