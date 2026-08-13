"use client";

import { BriefcaseBusiness, Plus, RefreshCw, Search } from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import { OpportunityModal } from "@/components/opportunities/opportunity-modal";
import { OpportunityStageModal } from "@/components/opportunities/opportunity-stage-modal";

import { PipelineBoard } from "@/components/pipeline/pipeline-board";
import { PipelineLossModal } from "@/components/pipeline/pipeline-loss-modal";

import { Button, Select, Spinner } from "@/components/ui";

import { getCustomers } from "@/lib/customers";
import { getLeads } from "@/lib/leads";

import { changeOpportunityStage, getOpportunities } from "@/lib/opportunities";

import { getPipelineStages } from "@/lib/pipeline-stages";
import { getUsers } from "@/lib/users";

import type { Customer } from "@/types/customer";
import type { Lead } from "@/types/lead";
import type { Opportunity } from "@/types/opportunity";
import type { PipelineStage } from "@/types/pipeline-stage";
import type { User } from "@/types/user";

type PipelineView = "ALL" | "OPEN";

interface LossTarget {
  opportunity: Opportunity;

  stage: PipelineStage;
}

export default function PipelinePage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);

  const [stages, setStages] = useState<PipelineStage[]>([]);

  const [customers, setCustomers] = useState<Customer[]>([]);

  const [leads, setLeads] = useState<Lead[]>([]);

  const [users, setUsers] = useState<User[]>([]);

  const [loading, setLoading] = useState(true);

  const [referenceLoading, setReferenceLoading] = useState(true);

  const [searchInput, setSearchInput] = useState("");

  const [search, setSearch] = useState("");

  const [ownerUserId, setOwnerUserId] = useState("ALL");

  const [view, setView] = useState<PipelineView>("ALL");

  const [modalOpen, setModalOpen] = useState(false);

  const [editingOpportunity, setEditingOpportunity] =
    useState<Opportunity | null>(null);

  const [stageTarget, setStageTarget] = useState<Opportunity | null>(null);

  const [lossTarget, setLossTarget] = useState<LossTarget | null>(null);

  const [movingOpportunityId, setMovingOpportunityId] = useState<string | null>(
    null,
  );

  const [error, setError] = useState<string | null>(null);

  const loadPipeline = useCallback(async (): Promise<void> => {
    setLoading(true);

    setError(null);

    try {
      const data = await loadAllPipelineOpportunities({
        search: search || undefined,

        ownerUserId: ownerUserId === "ALL" ? undefined : ownerUserId,

        openOnly: view === "OPEN",
      });

      setOpportunities(data);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load sales pipeline.",
      );
    } finally {
      setLoading(false);
    }
  }, [ownerUserId, search, view]);

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

      setStages(
        stageData
          .filter((stage) => stage.isActive)
          .sort((left, right) => left.position - right.position),
      );

      setCustomers(customerResult.data);

      setLeads(leadResult.data);

      setUsers(userResult.data);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load pipeline reference data.",
      );
    } finally {
      setReferenceLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReferenceData();
  }, [loadReferenceData]);

  useEffect(() => {
    void loadPipeline();
  }, [loadPipeline]);

  const activeUsers = useMemo(
    () =>
      users
        .filter((user) => user.isActive && !user.deletedAt)
        .sort((left, right) =>
          `${left.firstName} ${left.lastName}`.localeCompare(
            `${right.firstName} ${right.lastName}`,
          ),
        ),
    [users],
  );

  const visibleStages = useMemo(
    () => stages.filter((stage) => view === "ALL" || !stage.isClosed),
    [stages, view],
  );

  const summary = useMemo(() => {
    let shownValue = 0;

    let weightedValue = 0;

    let openDeals = 0;

    let closedDeals = 0;

    for (const opportunity of opportunities) {
      const amount = parseAmount(opportunity.amount);

      shownValue += amount;

      weightedValue += amount * (opportunity.probability / 100);

      if (opportunity.status === "OPEN") {
        openDeals += 1;
      } else {
        closedDeals += 1;
      }
    }

    return {
      shownValue,

      weightedValue,

      openDeals,

      closedDeals,
    };
  }, [opportunities]);

  function handleSearch(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

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

  function handleSaved(): void {
    setModalOpen(false);

    setEditingOpportunity(null);

    void loadPipeline();
  }

  function handleStageSaved(): void {
    setStageTarget(null);

    setMovingOpportunityId(null);

    void loadPipeline();
  }

  async function handleDropStage(
    opportunity: Opportunity,
    stage: PipelineStage,
  ): Promise<void> {
    if (opportunity.stageId === stage.id) {
      return;
    }

    if (stage.isClosed && !stage.isWon) {
      setLossTarget({
        opportunity,

        stage,
      });

      return;
    }

    setMovingOpportunityId(opportunity.id);

    setError(null);

    try {
      await changeOpportunityStage(opportunity.id, {
        stageId: stage.id,
      });

      await loadPipeline();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to move opportunity.",
      );
    } finally {
      setMovingOpportunityId(null);
    }
  }

  const loadingInitial =
    (loading || referenceLoading) && opportunities.length === 0;

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-blue-600">Sales & CRM</p>

            <h1 className="mt-1 text-2xl font-bold text-slate-900">
              Sales Pipeline
            </h1>

            <p className="mt-1 text-sm text-slate-600">
              Move opportunities through your sales process from qualification
              to close.
            </p>
          </div>

          <Button onClick={openCreate} disabled={referenceLoading}>
            <Plus size={18} />
            New Opportunity
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Deals shown"
            value={String(opportunities.length)}
          />

          <SummaryCard
            label="Shown value"
            value={formatAmount(summary.shownValue)}
          />

          <SummaryCard
            label="Weighted value"
            value={formatAmount(summary.weightedValue)}
          />

          <SummaryCard
            label="Open / Closed"
            value={`${summary.openDeals} / ${summary.closedDeals}`}
          />
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm xl:flex-row">
          <form onSubmit={handleSearch} className="flex min-w-0 flex-1">
            <div className="relative flex-1">
              <Search
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search pipeline..."
                className="h-10 w-full rounded-l-lg border border-slate-300 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <Button type="submit" className="rounded-l-none">
              Search
            </Button>
          </form>

          <div className="w-full xl:w-52">
            <Select
              value={ownerUserId}
              onChange={(event) => setOwnerUserId(event.target.value)}
            >
              <option value="ALL">All Assigned Users</option>

              {activeUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.firstName} {user.lastName}
                </option>
              ))}
            </Select>
          </div>

          <div className="w-full xl:w-40">
            <Select
              value={view}
              onChange={(event) => setView(event.target.value as PipelineView)}
            >
              <option value="ALL">All Deals</option>

              <option value="OPEN">Open Deals</option>
            </Select>
          </div>

          <Button
            variant="outline"
            disabled={loading || referenceLoading}
            onClick={() => {
              void Promise.all([loadPipeline(), loadReferenceData()]);
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

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {loadingInitial ? (
          <div className="flex min-h-96 items-center justify-center rounded-xl border border-slate-200 bg-white">
            <Spinner />
          </div>
        ) : opportunities.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <BriefcaseBusiness size={32} className="mx-auto text-slate-300" />

            <p className="mt-3 font-medium text-slate-700">
              No opportunities found
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Create an opportunity or adjust the current pipeline filters.
            </p>
          </div>
        ) : (
          <PipelineBoard
            opportunities={opportunities}
            stages={visibleStages}
            customers={customers}
            leads={leads}
            users={users}
            movingOpportunityId={movingOpportunityId}
            onOpen={openEdit}
            onChangeStage={setStageTarget}
            onDropStage={handleDropStage}
          />
        )}

        <div className="rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-sm text-blue-700">
          Drag an opportunity card into another stage to update the deal. Use
          Move stage on a card when drag-and-drop is not convenient.
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

      <PipelineLossModal
        open={Boolean(lossTarget)}
        opportunity={lossTarget?.opportunity ?? null}
        stage={lossTarget?.stage ?? null}
        onClose={() => setLossTarget(null)}
        onSaved={() => {
          setLossTarget(null);

          setMovingOpportunityId(null);

          void loadPipeline();
        }}
      />
    </>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;

  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

async function loadAllPipelineOpportunities({
  search,
  ownerUserId,
  openOnly,
}: {
  search?: string;

  ownerUserId?: string;

  openOnly: boolean;
}): Promise<Opportunity[]> {
  const data: Opportunity[] = [];

  let page = 1;

  while (true) {
    const result = await getOpportunities({
      search,

      ownerUserId,

      status: openOnly ? "OPEN" : undefined,

      recordState: "active",

      page,

      limit: 100,

      sortBy: "createdAt",

      sortDirection: "desc",
    });

    data.push(...result.data);

    const totalPages = Math.max(1, result.pagination.totalPages);

    if (page >= totalPages) {
      break;
    }

    page += 1;
  }

  return data;
}

function parseAmount(value: string): number {
  const amount = Number(value);

  return Number.isFinite(amount) ? amount : 0;
}

function formatAmount(value: number): string {
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,

    maximumFractionDigits: 2,
  }).format(value);
}
