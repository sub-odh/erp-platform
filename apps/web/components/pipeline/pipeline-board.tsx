"use client";

import {
  ArrowRightLeft,
  BriefcaseBusiness,
  CalendarDays,
  GripVertical,
  UserRound,
} from "lucide-react";

import { useMemo, useState, type DragEvent, type KeyboardEvent } from "react";

import type { Customer } from "@/types/customer";
import type { Lead } from "@/types/lead";
import type { Opportunity } from "@/types/opportunity";
import type { PipelineStage } from "@/types/pipeline-stage";
import type { User } from "@/types/user";

interface PipelineBoardProps {
  opportunities: Opportunity[];

  stages: PipelineStage[];

  customers: Customer[];

  leads: Lead[];

  users: User[];

  movingOpportunityId?: string | null;

  onOpen: (opportunity: Opportunity) => void;

  onChangeStage: (opportunity: Opportunity) => void;

  onDropStage: (
    opportunity: Opportunity,
    stage: PipelineStage,
  ) => void | Promise<void>;
}

export function PipelineBoard({
  opportunities,
  stages,
  customers,
  leads,
  users,
  movingOpportunityId = null,
  onOpen,
  onChangeStage,
  onDropStage,
}: PipelineBoardProps) {
  const [draggingOpportunityId, setDraggingOpportunityId] = useState<
    string | null
  >(null);

  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null);

  const customerMap = useMemo(
    () => new Map(customers.map((customer) => [customer.id, customer])),
    [customers],
  );

  const leadMap = useMemo(
    () => new Map(leads.map((lead) => [lead.id, lead])),
    [leads],
  );

  const userMap = useMemo(
    () => new Map(users.map((user) => [user.id, user])),
    [users],
  );

  const sortedStages = useMemo(
    () => [...stages].sort((left, right) => left.position - right.position),
    [stages],
  );

  function handleDragStart(
    event: DragEvent<HTMLDivElement>,
    opportunity: Opportunity,
  ): void {
    setDraggingOpportunityId(opportunity.id);

    event.dataTransfer.effectAllowed = "move";

    event.dataTransfer.setData(
      "application/x-erp-opportunity-id",
      opportunity.id,
    );

    event.dataTransfer.setData("text/plain", opportunity.id);
  }

  function handleDragEnd(): void {
    setDraggingOpportunityId(null);

    setDragOverStageId(null);
  }

  function handleDragOver(
    event: DragEvent<HTMLDivElement>,
    stageId: string,
  ): void {
    event.preventDefault();

    event.dataTransfer.dropEffect = "move";

    setDragOverStageId(stageId);
  }

  function handleDrop(
    event: DragEvent<HTMLDivElement>,
    stage: PipelineStage,
  ): void {
    event.preventDefault();

    const opportunityId =
      event.dataTransfer.getData("application/x-erp-opportunity-id") ||
      event.dataTransfer.getData("text/plain");

    setDraggingOpportunityId(null);

    setDragOverStageId(null);

    if (!opportunityId) {
      return;
    }

    const opportunity = opportunities.find((item) => item.id === opportunityId);

    if (!opportunity || opportunity.stageId === stage.id) {
      return;
    }

    void onDropStage(opportunity, stage);
  }

  if (sortedStages.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
        <BriefcaseBusiness size={32} className="mx-auto text-slate-300" />

        <p className="mt-3 font-medium text-slate-700">
          No pipeline stages available
        </p>

        <p className="mt-1 text-sm text-slate-500">
          Active pipeline stages are required before opportunities can be shown
          on the board.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-3">
      <div className="flex min-w-max items-start gap-3">
        {sortedStages.map((stage) => {
          const stageOpportunities = opportunities
            .filter((opportunity) => opportunity.stageId === stage.id)
            .sort(compareOpportunities);

          const stageValue = stageOpportunities.reduce(
            (total, opportunity) => total + parseAmount(opportunity.amount),
            0,
          );

          const dragActive = dragOverStageId === stage.id;

          return (
            <div
              key={stage.id}
              onDragOver={(event) => handleDragOver(event, stage.id)}
              onDragEnter={(event) => {
                event.preventDefault();

                setDragOverStageId(stage.id);
              }}
              onDragLeave={(event) => {
                const relatedTarget = event.relatedTarget;

                if (
                  relatedTarget instanceof Node &&
                  event.currentTarget.contains(relatedTarget)
                ) {
                  return;
                }

                setDragOverStageId((current) =>
                  current === stage.id ? null : current,
                );
              }}
              onDrop={(event) => handleDrop(event, stage)}
              className={[
                "w-75 shrink-0 rounded-xl border bg-slate-50/70 transition",
                dragActive
                  ? "border-blue-400 bg-blue-50/70 ring-2 ring-blue-100"
                  : "border-slate-200",
              ].join(" ")}
            >
              <StageHeader
                stage={stage}
                count={stageOpportunities.length}
                value={stageValue}
              />

              <div className="min-h-44 space-y-2.5 p-2.5">
                {stageOpportunities.length === 0 ? (
                  <div
                    className={[
                      "flex min-h-32 items-center justify-center rounded-lg border border-dashed px-4 text-center text-sm transition",
                      dragActive
                        ? "border-blue-300 bg-blue-50 text-blue-600"
                        : "border-slate-200 bg-white/60 text-slate-400",
                    ].join(" ")}
                  >
                    {dragActive ? "Drop opportunity here" : "No opportunities"}
                  </div>
                ) : (
                  stageOpportunities.map((opportunity) => {
                    const customer = opportunity.customerId
                      ? customerMap.get(opportunity.customerId)
                      : undefined;

                    const lead = opportunity.leadId
                      ? leadMap.get(opportunity.leadId)
                      : undefined;

                    const owner = opportunity.ownerUserId
                      ? userMap.get(opportunity.ownerUserId)
                      : undefined;

                    const busy = movingOpportunityId === opportunity.id;

                    const dragging = draggingOpportunityId === opportunity.id;

                    return (
                      <PipelineCard
                        key={opportunity.id}
                        opportunity={opportunity}
                        customer={customer}
                        lead={lead}
                        owner={owner}
                        busy={busy}
                        dragging={dragging}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        onOpen={onOpen}
                        onChangeStage={onChangeStage}
                      />
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StageHeader({
  stage,
  count,
  value,
}: {
  stage: PipelineStage;
  count: number;
  value: number;
}) {
  return (
    <div
      className={[
        "rounded-t-xl border-b px-3.5 py-3",
        getStageHeaderClasses(stage),
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={[
                "h-2.5 w-2.5 shrink-0 rounded-full",
                getStageDotClasses(stage),
              ].join(" ")}
            />

            <h2 className="truncate font-semibold text-slate-900">
              {stage.name}
            </h2>
          </div>

          <p className="mt-1 text-xs text-slate-500">
            {stage.probability}% probability
          </p>
        </div>

        <span className="rounded-full bg-white/80 px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
          {count}
        </span>
      </div>

      <div className="mt-2.5 flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">Total value</span>

        <span className="text-sm font-semibold text-slate-800">
          {formatAmount(value)}
        </span>
      </div>
    </div>
  );
}

function PipelineCard({
  opportunity,
  customer,
  lead,
  owner,
  busy,
  dragging,
  onDragStart,
  onDragEnd,
  onOpen,
  onChangeStage,
}: {
  opportunity: Opportunity;

  customer: Customer | undefined;

  lead: Lead | undefined;

  owner: User | undefined;

  busy: boolean;

  dragging: boolean;

  onDragStart: (
    event: DragEvent<HTMLDivElement>,
    opportunity: Opportunity,
  ) => void;

  onDragEnd: () => void;

  onOpen: (opportunity: Opportunity) => void;

  onChangeStage: (opportunity: Opportunity) => void;
}) {
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();

      onOpen(opportunity);
    }
  }

  return (
    <div
      draggable={!busy}
      role="button"
      tabIndex={0}
      aria-label={`Open ${opportunity.name}`}
      onDragStart={(event) => onDragStart(event, opportunity)}
      onDragEnd={onDragEnd}
      onClick={() => {
        if (!busy) {
          onOpen(opportunity);
        }
      }}
      onKeyDown={handleKeyDown}
      className={[
        "group cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-sm outline-none transition",
        "hover:border-blue-300 hover:shadow-md focus:border-blue-400 focus:ring-2 focus:ring-blue-100",
        dragging ? "opacity-40" : "",
        busy ? "cursor-wait opacity-60" : "",
      ].join(" ")}
    >
      <div className="flex items-start gap-2">
        <GripVertical
          size={16}
          className="mt-0.5 shrink-0 cursor-grab text-slate-300 group-hover:text-slate-400"
        />

        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-slate-900">
            {opportunity.name}
          </p>

          <p className="mt-1 truncate text-sm text-slate-500">
            {getAccountLabel(customer, lead)}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-lg font-semibold text-slate-900">
          {formatAmount(parseAmount(opportunity.amount))}
        </p>

        <div className="mt-2 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-blue-500"
              style={{
                width: `${Math.max(
                  0,
                  Math.min(100, opportunity.probability),
                )}%`,
              }}
            />
          </div>

          <span className="text-xs font-semibold text-slate-600">
            {opportunity.probability}%
          </span>
        </div>
      </div>

      <div className="mt-4 space-y-2 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <UserRound size={14} className="shrink-0 text-slate-400" />

          <span className="truncate">
            {owner ? `${owner.firstName} ${owner.lastName}` : "Unassigned"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <CalendarDays size={14} className="shrink-0 text-slate-400" />

          <span>
            {opportunity.expectedCloseDate
              ? formatDate(opportunity.expectedCloseDate)
              : "No close date"}
          </span>
        </div>
      </div>

      <div className="mt-3 flex justify-end border-t border-slate-100 pt-2.5">
        <button
          type="button"
          disabled={busy}
          onClick={(event) => {
            event.stopPropagation();

            onChangeStage(opportunity);
          }}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ArrowRightLeft size={13} />
          Move stage
        </button>
      </div>
    </div>
  );
}

function getStageHeaderClasses(stage: PipelineStage): string {
  if (stage.isWon) {
    return "border-emerald-200 bg-emerald-50/80";
  }

  if (stage.isClosed) {
    return "border-red-200 bg-red-50/80";
  }

  return "border-slate-200 bg-white";
}

function getStageDotClasses(stage: PipelineStage): string {
  if (stage.isWon) {
    return "bg-emerald-500";
  }

  if (stage.isClosed) {
    return "bg-red-500";
  }

  return "bg-blue-500";
}

function getAccountLabel(
  customer: Customer | undefined,
  lead: Lead | undefined,
): string {
  if (customer) {
    return customer.name;
  }

  if (lead?.companyName) {
    return lead.companyName;
  }

  if (lead) {
    return `${lead.firstName} ${lead.lastName}`;
  }

  return "No customer linked";
}

function compareOpportunities(left: Opportunity, right: Opportunity): number {
  const leftDate = left.expectedCloseDate ?? "9999-12-31";

  const rightDate = right.expectedCloseDate ?? "9999-12-31";

  const dateComparison = leftDate.localeCompare(rightDate);

  if (dateComparison !== 0) {
    return dateComparison;
  }

  return right.updatedAt.localeCompare(left.updatedAt);
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

function formatDate(value: string): string {
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? `${value}T00:00:00`
    : value;

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(normalized));
}
