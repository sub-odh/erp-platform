"use client";

import { Plus, RefreshCw, Search } from "lucide-react";

import { useCallback, useEffect, useState, type FormEvent } from "react";

import { Button, ConfirmDialog, Select, Spinner } from "@/components/ui";

import { LeadConversionModal } from "@/components/leads/lead-conversion-modal";
import { LeadModal } from "@/components/leads/lead-modal";
import { LeadTable } from "@/components/leads/lead-table";
import { LeadViewModal } from "@/components/leads/lead-view-modal";

import { getStoredUser } from "@/lib/auth";

import {
  archiveLead,
  getLeads,
  permanentlyDeleteLead,
  restoreLead,
  updateLeadStatus,
} from "@/lib/leads";

import type {
  ConvertLeadResponse,
  EditableLeadStatus,
  Lead,
  LeadPagination,
  LeadRecordState,
  LeadStatus,
} from "@/types/lead";

const PAGE_SIZE = 20;

type StatusFilter = "ALL" | LeadStatus;

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);

  const [pagination, setPagination] = useState<LeadPagination | null>(null);

  const [loading, setLoading] = useState(true);

  const [searchInput, setSearchInput] = useState("");

  const [search, setSearch] = useState("");

  const [status, setStatus] = useState<StatusFilter>("ALL");

  const [recordState, setRecordState] = useState<LeadRecordState>("active");

  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);

  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  const [viewingLead, setViewingLead] = useState<Lead | null>(null);

  const [conversionTarget, setConversionTarget] = useState<Lead | null>(null);

  const [conversionSuccess, setConversionSuccess] = useState<{
    opportunityName: string;
    opportunityId: string;
  } | null>(null);

  const [archiveTarget, setArchiveTarget] = useState<Lead | null>(null);

  const [permanentDeleteTarget, setPermanentDeleteTarget] =
    useState<Lead | null>(null);

  const [archiving, setArchiving] = useState(false);

  const [deletingPermanently, setDeletingPermanently] = useState(false);

  const [busyLeadId, setBusyLeadId] = useState<string | null>(null);

  const [canPermanentlyDelete, setCanPermanentlyDelete] = useState(false);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const role = getStoredUser()?.role;

    setCanPermanentlyDelete(role === "OWNER" || role === "ADMIN");
  }, []);

  const loadLeads = useCallback(async (): Promise<void> => {
    setLoading(true);

    setError(null);

    try {
      const result = await getLeads({
        search: search || undefined,

        status: status === "ALL" ? undefined : status,

        recordState,

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
  }, [page, recordState, search, status]);

  useEffect(() => {
    void loadLeads();
  }, [loadLeads]);

  function handleSearch(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    setPage(1);

    setSearch(searchInput.trim());
  }

  function openCreate(): void {
    if (recordState === "archived") {
      return;
    }

    setEditingLead(null);

    setModalOpen(true);
  }

  function openEdit(lead: Lead): void {
    if (lead.deletedAt) {
      return;
    }

    setEditingLead(lead);

    setModalOpen(true);
  }

  function handleSaved(lead: Lead): void {
    setModalOpen(false);

    setEditingLead(null);

    setLeads((current) =>
      current.map((item) => (item.id === lead.id ? lead : item)),
    );

    void loadLeads();
  }

  async function handleStatusChange(
    lead: Lead,
    nextStatus: EditableLeadStatus,
  ): Promise<void> {
    if (lead.deletedAt) {
      return;
    }

    setError(null);

    try {
      const updated = await updateLeadStatus(lead.id, nextStatus);

      setLeads((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );

      await loadLeads();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update lead status.",
      );

      throw requestError;
    }
  }

  function handleConverted(result: ConvertLeadResponse): void {
    setConversionTarget(null);

    setConversionSuccess({
      opportunityName: result.opportunity.name,

      opportunityId: result.opportunity.id,
    });

    setLeads((current) =>
      current.map((lead) => (lead.id === result.lead.id ? result.lead : lead)),
    );

    void loadLeads();
  }

  async function confirmArchive(): Promise<void> {
    if (!archiveTarget) {
      return;
    }

    setArchiving(true);

    setError(null);

    try {
      await archiveLead(archiveTarget.id);

      setArchiveTarget(null);

      /*
       * If we removed the final row
       * of a later page, move back
       * one page.
       */
      if (leads.length === 1 && page > 1 && recordState === "active") {
        setPage((current) => current - 1);
      } else {
        await loadLeads();
      }
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

  async function handleRestore(lead: Lead): Promise<void> {
    setBusyLeadId(lead.id);

    setError(null);

    try {
      await restoreLead(lead.id);

      if (leads.length === 1 && page > 1 && recordState === "archived") {
        setPage((current) => current - 1);
      } else {
        await loadLeads();
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to restore lead.",
      );
    } finally {
      setBusyLeadId(null);
    }
  }

  async function confirmPermanentDelete(): Promise<void> {
    if (!permanentDeleteTarget) {
      return;
    }

    setDeletingPermanently(true);

    setError(null);

    try {
      await permanentlyDeleteLead(permanentDeleteTarget.id);

      setPermanentDeleteTarget(null);

      if (leads.length === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        await loadLeads();
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to permanently delete lead.",
      );
    } finally {
      setDeletingPermanently(false);
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

          <Button disabled={recordState === "archived"} onClick={openCreate}>
            <Plus size={18} />
            Add New Lead
          </Button>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm xl:flex-row">
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

          <div className="w-full xl:w-48">
            <Select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as StatusFilter);

                setPage(1);
              }}
            >
              <option value="ALL">All Statuses</option>

              <option value="NEW">New</option>

              <option value="CONTACTED">Contacted</option>

              <option value="QUALIFIED">Qualified</option>

              <option value="DISQUALIFIED">Disqualified</option>

              <option value="CONVERTED">Converted</option>
            </Select>
          </div>

          <div className="w-full xl:w-48">
            <Select
              value={recordState}
              onChange={(event) => {
                setRecordState(event.target.value as LeadRecordState);

                setPage(1);
              }}
            >
              <option value="active">Active</option>

              <option value="archived">Archived</option>

              <option value="all">All records</option>
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

        {recordState === "archived" ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Archived leads are read-only. Restore a lead before editing or
            changing its status.
          </div>
        ) : null}

        {conversionSuccess ? (
          <div className="flex flex-col gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Lead successfully converted to opportunity{" "}
              <span className="font-semibold">
                “{conversionSuccess.opportunityName}”
              </span>
              .
            </span>

            <button
              type="button"
              onClick={() => setConversionSuccess(null)}
              className="self-start font-medium text-emerald-700 hover:text-emerald-900 sm:self-auto"
            >
              Dismiss
            </button>
          </div>
        ) : null}

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
              recordState={recordState}
              canPermanentlyDelete={canPermanentlyDelete}
              busyLeadId={busyLeadId}
              onView={setViewingLead}
              onEdit={openEdit}
              onConvert={setConversionTarget}
              onArchive={setArchiveTarget}
              onRestore={(lead) => void handleRestore(lead)}
              onPermanentDelete={setPermanentDeleteTarget}
              onChangeStatus={handleStatusChange}
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

      <LeadViewModal
        open={viewingLead !== null}
        lead={viewingLead}
        onClose={() => setViewingLead(null)}
      />

      <LeadModal
        open={modalOpen}
        lead={editingLead}
        onClose={() => {
          setModalOpen(false);

          setEditingLead(null);
        }}
        onSaved={handleSaved}
      />

      <LeadConversionModal
        open={conversionTarget !== null}
        lead={conversionTarget}
        onClose={() => setConversionTarget(null)}
        onConverted={handleConverted}
      />

      <ConfirmDialog
        open={Boolean(archiveTarget)}
        title="Archive lead"
        description={
          archiveTarget
            ? `Archive ${archiveTarget.firstName} ${archiveTarget.lastName}? The lead can be restored later.`
            : ""
        }
        confirmLabel="Archive lead"
        destructive
        loading={archiving}
        onClose={() => setArchiveTarget(null)}
        onConfirm={() => void confirmArchive()}
      />

      <ConfirmDialog
        open={Boolean(permanentDeleteTarget)}
        title="Delete lead permanently"
        description={
          permanentDeleteTarget
            ? `Permanently delete ${permanentDeleteTarget.firstName} ${permanentDeleteTarget.lastName}? This cannot be undone.`
            : ""
        }
        confirmLabel="Delete permanently"
        destructive
        loading={deletingPermanently}
        onClose={() => setPermanentDeleteTarget(null)}
        onConfirm={() => void confirmPermanentDelete()}
      />
    </>
  );
}
