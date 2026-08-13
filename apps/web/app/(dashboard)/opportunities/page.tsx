"use client";

import { Plus, RefreshCw, Search } from "lucide-react";

import { useCallback, useEffect, useState, type FormEvent } from "react";

import { OpportunityModal } from "@/components/opportunities/opportunity-modal";

import { OpportunityStageModal } from "@/components/opportunities/opportunity-stage-modal";

import { OpportunityTable } from "@/components/opportunities/opportunity-table";

import { Button, ConfirmDialog, Select, Spinner } from "@/components/ui";

import { getStoredUser } from "@/lib/auth";

import { getCustomers } from "@/lib/customers";

import { getLeads } from "@/lib/leads";

import {
  archiveOpportunity,
  getOpportunities,
  permanentlyDeleteOpportunity,
  restoreOpportunity,
} from "@/lib/opportunities";

import { getPipelineStages } from "@/lib/pipeline-stages";

import { getUsers } from "@/lib/users";

import type { Customer } from "@/types/customer";

import type { Lead } from "@/types/lead";

import type {
  Opportunity,
  OpportunityPagination,
  OpportunityRecordState,
  OpportunityStatus,
} from "@/types/opportunity";

import type { PipelineStage } from "@/types/pipeline-stage";

import type { User } from "@/types/user";

const PAGE_SIZE = 20;

type StatusFilter = "ALL" | OpportunityStatus;

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);

  const [pagination, setPagination] = useState<OpportunityPagination | null>(
    null,
  );

  const [stages, setStages] = useState<PipelineStage[]>([]);

  const [customers, setCustomers] = useState<Customer[]>([]);

  const [leads, setLeads] = useState<Lead[]>([]);

  const [users, setUsers] = useState<User[]>([]);

  const [loading, setLoading] = useState(true);

  const [referenceLoading, setReferenceLoading] = useState(true);

  const [searchInput, setSearchInput] = useState("");

  const [search, setSearch] = useState("");

  const [status, setStatus] = useState<StatusFilter>("ALL");

  const [recordState, setRecordState] =
    useState<OpportunityRecordState>("active");

  const [stageFilter, setStageFilter] = useState("ALL");

  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);

  const [editingOpportunity, setEditingOpportunity] =
    useState<Opportunity | null>(null);

  const [stageTarget, setStageTarget] = useState<Opportunity | null>(null);

  const [archiveTarget, setArchiveTarget] = useState<Opportunity | null>(null);

  const [restoreTarget, setRestoreTarget] = useState<Opportunity | null>(null);

  const [permanentDeleteTarget, setPermanentDeleteTarget] =
    useState<Opportunity | null>(null);

  const [archiving, setArchiving] = useState(false);

  const [restoring, setRestoring] = useState(false);

  const [permanentlyDeleting, setPermanentlyDeleting] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const currentUser = getStoredUser();

  const canPermanentlyDelete =
    currentUser?.role === "OWNER" || currentUser?.role === "ADMIN";

  const loadOpportunities = useCallback(async (): Promise<void> => {
    setLoading(true);

    setError(null);

    try {
      const result = await getOpportunities({
        search: search || undefined,

        status: status === "ALL" ? undefined : status,

        recordState,

        stageId: stageFilter === "ALL" ? undefined : stageFilter,

        page,

        limit: PAGE_SIZE,

        sortBy: "createdAt",

        sortDirection: "desc",
      });

      setOpportunities(result.data);

      setPagination(result.pagination);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load opportunities.",
      );
    } finally {
      setLoading(false);
    }
  }, [page, recordState, search, stageFilter, status]);

  const loadReferenceData = useCallback(async (): Promise<void> => {
    setReferenceLoading(true);

    try {
      const [stageData, customerResult, leadResult, userResult] =
        await Promise.all([
          getPipelineStages(),

          getCustomers({
            page: 1,

            limit: 100,

            sortBy: "name",

            sortDirection: "asc",
          }),

          getLeads({
            page: 1,

            limit: 100,

            sortBy: "createdAt",

            sortDirection: "desc",
          }),

          getUsers({
            status: "all",

            page: 1,

            limit: 100,

            sortBy: "firstName",

            sortDirection: "asc",
          }),
        ]);

      setStages([...stageData].sort((a, b) => a.position - b.position));

      setCustomers(customerResult.data);

      setLeads(leadResult.data);

      setUsers(userResult.data);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load sales reference data.",
      );
    } finally {
      setReferenceLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReferenceData();
  }, [loadReferenceData]);

  useEffect(() => {
    void loadOpportunities();
  }, [loadOpportunities]);

  function handleSearch(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    setPage(1);

    setSearch(searchInput.trim());
  }

  function openCreate(): void {
    setEditingOpportunity(null);

    setModalOpen(true);
  }

  function openEdit(opportunity: Opportunity): void {
    setEditingOpportunity(opportunity);

    setModalOpen(true);
  }

  function handleSaved(opportunity: Opportunity): void {
    setModalOpen(false);

    setEditingOpportunity(null);

    void loadOpportunities();
  }

  function handleStageSaved(opportunity: Opportunity): void {
    setStageTarget(null);

    setOpportunities((current) =>
      current.map((item) => (item.id === opportunity.id ? opportunity : item)),
    );

    void loadOpportunities();
  }

  async function confirmArchive(): Promise<void> {
    if (!archiveTarget) {
      return;
    }

    setArchiving(true);

    setError(null);

    try {
      await archiveOpportunity(archiveTarget.id);

      setArchiveTarget(null);

      await loadOpportunities();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to archive opportunity.",
      );
    } finally {
      setArchiving(false);
    }
  }

  async function confirmRestore(): Promise<void> {
    if (!restoreTarget) {
      return;
    }

    setRestoring(true);

    setError(null);

    try {
      await restoreOpportunity(restoreTarget.id);

      setRestoreTarget(null);

      await loadOpportunities();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to restore opportunity.",
      );
    } finally {
      setRestoring(false);
    }
  }

  async function confirmPermanentDelete(): Promise<void> {
    if (!permanentDeleteTarget) {
      return;
    }

    setPermanentlyDeleting(true);

    setError(null);

    try {
      await permanentlyDeleteOpportunity(permanentDeleteTarget.id);

      setPermanentDeleteTarget(null);

      await loadOpportunities();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to permanently delete opportunity.",
      );
    } finally {
      setPermanentlyDeleting(false);
    }
  }

  const total = pagination?.total ?? 0;

  const totalPages = pagination?.totalPages ?? 1;

  const activeStages = stages.filter((stage) => stage.isActive);

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Opportunities</h1>

            <p className="mt-1 text-sm text-slate-600">
              Track active deals, archived opportunities and sales outcomes.
            </p>
          </div>

          <Button
            onClick={openCreate}
            disabled={referenceLoading || recordState === "archived"}
          >
            <Plus size={18} />
            Add Opportunity
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
                placeholder="Search opportunities..."
                className="h-10 w-full rounded-l-lg border border-slate-300 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <Button type="submit" className="rounded-l-none">
              Search
            </Button>
          </form>

          <div className="w-full xl:w-44">
            <Select
              value={recordState}
              onChange={(event) => {
                setRecordState(event.target.value as OpportunityRecordState);

                setPage(1);
              }}
            >
              <option value="active">Active Records</option>

              <option value="archived">Archived Records</option>

              <option value="all">All Records</option>
            </Select>
          </div>

          <div className="w-full xl:w-40">
            <Select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as StatusFilter);

                setPage(1);
              }}
            >
              <option value="ALL">All Statuses</option>

              <option value="OPEN">Open</option>

              <option value="WON">Won</option>

              <option value="LOST">Lost</option>
            </Select>
          </div>

          <div className="w-full xl:w-44">
            <Select
              value={stageFilter}
              onChange={(event) => {
                setStageFilter(event.target.value);

                setPage(1);
              }}
            >
              <option value="ALL">All Stages</option>

              {activeStages.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.name}
                </option>
              ))}
            </Select>
          </div>

          <Button
            variant="outline"
            disabled={loading || referenceLoading}
            onClick={() => {
              void Promise.all([loadOpportunities(), loadReferenceData()]);
            }}
          >
            <RefreshCw
              size={17}
              className={
                loading || referenceLoading ? "animate-spin" : undefined
              }
            />
            Refresh
          </Button>
        </div>

        {recordState === "archived" ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Archived opportunities are hidden from the normal sales workflow.
            They can be restored. Owners and administrators can also permanently
            delete them.
          </div>
        ) : null}

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          {loading && opportunities.length === 0 ? (
            <div className="flex min-h-64 items-center justify-center">
              <Spinner />
            </div>
          ) : (
            <OpportunityTable
              opportunities={opportunities}
              stages={stages}
              customers={customers}
              leads={leads}
              users={users}
              canPermanentlyDelete={canPermanentlyDelete}
              onEdit={openEdit}
              onChangeStage={setStageTarget}
              onArchive={setArchiveTarget}
              onRestore={setRestoreTarget}
              onPermanentDelete={setPermanentDeleteTarget}
            />
          )}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            {total} {total === 1 ? "opportunity" : "opportunities"}
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

      <OpportunityModal
        open={modalOpen}
        opportunity={editingOpportunity}
        stages={stages}
        customers={customers}
        leads={leads}
        users={users}
        onClose={() => {
          setModalOpen(false);

          setEditingOpportunity(null);
        }}
        onSaved={handleSaved}
      />

      <OpportunityStageModal
        open={Boolean(stageTarget)}
        opportunity={stageTarget}
        stages={stages}
        onClose={() => setStageTarget(null)}
        onSaved={handleStageSaved}
      />

      <ConfirmDialog
        open={Boolean(archiveTarget)}
        title="Archive opportunity"
        description={
          archiveTarget
            ? `Archive "${archiveTarget.name}"? You can restore it later from Archived records.`
            : ""
        }
        confirmLabel="Archive opportunity"
        destructive
        loading={archiving}
        onClose={() => setArchiveTarget(null)}
        onConfirm={() => void confirmArchive()}
      />

      <ConfirmDialog
        open={Boolean(restoreTarget)}
        title="Restore opportunity"
        description={
          restoreTarget
            ? `Restore "${restoreTarget.name}" to the active opportunity list?`
            : ""
        }
        confirmLabel="Restore opportunity"
        loading={restoring}
        onClose={() => setRestoreTarget(null)}
        onConfirm={() => void confirmRestore()}
      />

      <ConfirmDialog
        open={Boolean(permanentDeleteTarget)}
        title="Delete opportunity permanently"
        description={
          permanentDeleteTarget
            ? `Permanently delete "${permanentDeleteTarget.name}"? This cannot be undone.`
            : ""
        }
        confirmLabel="Delete permanently"
        destructive
        loading={permanentlyDeleting}
        onClose={() => setPermanentDeleteTarget(null)}
        onConfirm={() => void confirmPermanentDelete()}
      />
    </>
  );
}
