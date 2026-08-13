"use client";

import {
  ArchiveRestore,
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  MoreHorizontal,
  Pencil,
  Trash2,
  UserRound,
} from "lucide-react";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { OpportunityStatusBadge } from "./opportunity-status-badge";

import type { Customer } from "@/types/customer";
import type { Lead } from "@/types/lead";
import type { Opportunity } from "@/types/opportunity";
import type { PipelineStage } from "@/types/pipeline-stage";
import type { User } from "@/types/user";

interface OpportunityTableProps {
  opportunities: Opportunity[];

  stages: PipelineStage[];

  customers: Customer[];

  leads: Lead[];

  users: User[];

  canPermanentlyDelete: boolean;

  onEdit: (opportunity: Opportunity) => void;

  onChangeStage: (opportunity: Opportunity) => void;

  onArchive: (opportunity: Opportunity) => void;

  onRestore: (opportunity: Opportunity) => void;

  onPermanentDelete: (opportunity: Opportunity) => void;
}

interface MenuPosition {
  top: number;

  right: number;
}

export function OpportunityTable({
  opportunities,
  stages,
  customers,
  leads,
  users,
  canPermanentlyDelete,
  onEdit,
  onChangeStage,
  onArchive,
  onRestore,
  onPermanentDelete,
}: OpportunityTableProps) {
  const [menuOpportunity, setMenuOpportunity] = useState<Opportunity | null>(
    null,
  );

  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);

  const stageMap = useMemo(
    () => new Map(stages.map((stage) => [stage.id, stage])),
    [stages],
  );

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

  useEffect(() => {
    if (!menuOpportunity) {
      return;
    }

    function close(): void {
      setMenuOpportunity(null);

      setMenuPosition(null);
    }

    function handleClick(event: MouseEvent): void {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        close();
      }
    }

    function handleKey(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        close();
      }
    }

    window.addEventListener("scroll", close, true);

    window.addEventListener("resize", close);

    document.addEventListener("mousedown", handleClick);

    document.addEventListener("keydown", handleKey);

    return () => {
      window.removeEventListener("scroll", close, true);

      window.removeEventListener("resize", close);

      document.removeEventListener("mousedown", handleClick);

      document.removeEventListener("keydown", handleKey);
    };
  }, [menuOpportunity]);

  function closeMenu(): void {
    setMenuOpportunity(null);

    setMenuPosition(null);
  }

  function openMenu(opportunity: Opportunity, button: HTMLButtonElement): void {
    if (menuOpportunity?.id === opportunity.id) {
      closeMenu();

      return;
    }

    const rect = button.getBoundingClientRect();

    const menuHeight = opportunity.deletedAt
      ? canPermanentlyDelete
        ? 116
        : 58
      : 104;

    const preferredTop = rect.bottom + 8;

    const top =
      preferredTop + menuHeight > window.innerHeight - 12
        ? Math.max(12, rect.top - menuHeight - 8)
        : preferredTop;

    setMenuOpportunity(opportunity);

    setMenuPosition({
      top,

      right: Math.max(12, window.innerWidth - rect.right),
    });
  }

  if (opportunities.length === 0) {
    return (
      <div className="border-t border-slate-200 bg-white px-6 py-16 text-center">
        <BriefcaseBusiness size={30} className="mx-auto text-slate-300" />

        <p className="mt-3 font-medium text-slate-700">
          No opportunities found
        </p>

        <p className="mt-1 text-sm text-slate-500">
          No opportunities match the current filters.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto border-t border-slate-200 bg-white">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-white">
              <Header>Opportunity / Customer</Header>

              <Header>Value</Header>

              <Header>Probability</Header>

              <Header>Assigned To</Header>

              <Header>Expected Close</Header>

              <Header>Deal Stage</Header>

              <Header>Status</Header>

              <Header align="right">Action</Header>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {opportunities.map((opportunity) => {
              const stage = stageMap.get(opportunity.stageId);

              const customer = opportunity.customerId
                ? customerMap.get(opportunity.customerId)
                : undefined;

              const lead = opportunity.leadId
                ? leadMap.get(opportunity.leadId)
                : undefined;

              const owner = opportunity.ownerUserId
                ? userMap.get(opportunity.ownerUserId)
                : undefined;

              const archived = Boolean(opportunity.deletedAt);

              return (
                <tr
                  key={opportunity.id}
                  className={[
                    "transition hover:bg-slate-50",
                    archived ? "bg-slate-50/70" : "",
                  ].join(" ")}
                >
                  {/* OPPORTUNITY / CUSTOMER */}
                  <td className="min-w-64 px-6 py-4">
                    <div className="flex gap-3">
                      <div
                        className={[
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                          archived
                            ? "bg-slate-100 text-slate-400"
                            : "bg-blue-50 text-blue-600",
                        ].join(" ")}
                      >
                        <BriefcaseBusiness size={18} />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p
                            className={[
                              "font-semibold",
                              archived ? "text-slate-500" : "text-slate-900",
                            ].join(" ")}
                          >
                            {opportunity.name}
                          </p>

                          {archived ? (
                            <span className="inline-flex rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                              Archived
                            </span>
                          ) : null}
                        </div>

                        <p className="mt-0.5 truncate text-sm text-slate-600">
                          {getAccountLabel(customer, lead)}
                        </p>

                        {archived && opportunity.deletedAt ? (
                          <p className="mt-1 text-xs text-slate-400">
                            Archived {formatDate(opportunity.deletedAt)}
                          </p>
                        ) : lead ? (
                          <p className="mt-1 truncate text-xs text-slate-400">
                            Lead: {lead.firstName} {lead.lastName}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </td>

                  {/* VALUE */}
                  <td className="whitespace-nowrap px-6 py-4">
                    <p className="font-semibold text-slate-900">
                      {formatAmount(opportunity.amount)}
                    </p>
                  </td>

                  {/* PROBABILITY */}
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-blue-500"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(0, opportunity.probability),
                            )}%`,
                          }}
                        />
                      </div>

                      <span className="text-sm font-medium text-slate-700">
                        {opportunity.probability}%
                      </span>
                    </div>
                  </td>

                  {/* ASSIGNED TO */}
                  <td className="whitespace-nowrap px-6 py-4">
                    {owner ? (
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                          <UserRound size={13} />
                        </div>

                        <div>
                          <p className="text-sm font-medium text-slate-700">
                            {owner.firstName} {owner.lastName}
                          </p>

                          <p className="text-[10px] uppercase text-slate-400">
                            {owner.role}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400">Unassigned</span>
                    )}
                  </td>

                  {/* EXPECTED CLOSE */}
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                    {opportunity.expectedCloseDate ? (
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays size={14} className="text-slate-400" />

                        {formatDate(opportunity.expectedCloseDate)}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>

                  {/* DEAL STAGE */}
                  <td className="whitespace-nowrap px-6 py-4">
                    {archived ? (
                      <StageBadge stage={stage} />
                    ) : (
                      <button
                        type="button"
                        onClick={() => onChangeStage(opportunity)}
                        title="Click to change deal stage"
                        aria-label={`Change stage for ${opportunity.name}`}
                        className="group rounded-full text-left outline-none transition focus:ring-2 focus:ring-blue-300 focus:ring-offset-2"
                      >
                        <StageBadge stage={stage} interactive />
                      </button>
                    )}
                  </td>

                  {/* STATUS */}
                  <td className="whitespace-nowrap px-6 py-4">
                    <OpportunityStatusBadge status={opportunity.status} />
                  </td>

                  {/* ACTION */}
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <button
                      type="button"
                      onClick={(event) =>
                        openMenu(opportunity, event.currentTarget)
                      }
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                      aria-label={`Actions for ${opportunity.name}`}
                    >
                      <MoreHorizontal size={18} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {menuOpportunity && menuPosition ? (
        <div
          ref={menuRef}
          className="fixed z-100 w-52 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-xl"
          style={{
            top: menuPosition.top,

            right: menuPosition.right,
          }}
        >
          {menuOpportunity.deletedAt ? (
            <>
              <button
                type="button"
                onClick={() => {
                  const opportunity = menuOpportunity;

                  closeMenu();

                  onRestore(opportunity);
                }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-emerald-700 hover:bg-emerald-50"
              >
                <ArchiveRestore size={15} />
                Restore opportunity
              </button>

              {canPermanentlyDelete ? (
                <>
                  <div className="my-1 border-t border-slate-100" />

                  <button
                    type="button"
                    onClick={() => {
                      const opportunity = menuOpportunity;

                      closeMenu();

                      onPermanentDelete(opportunity);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={15} />
                    Delete permanently
                  </button>
                </>
              ) : null}
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  const opportunity = menuOpportunity;

                  closeMenu();

                  onEdit(opportunity);
                }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
              >
                <Pencil size={15} />
                Edit opportunity
              </button>

              <div className="my-1 border-t border-slate-100" />

              <button
                type="button"
                onClick={() => {
                  const opportunity = menuOpportunity;

                  closeMenu();

                  onArchive(opportunity);
                }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 size={15} />
                Archive
              </button>
            </>
          )}
        </div>
      ) : null}
    </>
  );
}

function Header({
  children,
  align = "left",
}: {
  children: ReactNode;

  align?: "left" | "right";
}) {
  return (
    <th
      className={[
        "px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-700",
        align === "right" ? "text-right" : "text-left",
      ].join(" ")}
    >
      {children}
    </th>
  );
}

function StageBadge({
  stage,
  interactive = false,
}: {
  stage: PipelineStage | undefined;

  interactive?: boolean;
}) {
  if (!stage) {
    return (
      <span
        className={[
          "inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500",
          interactive ? "transition group-hover:bg-slate-200" : "",
        ].join(" ")}
      >
        Unknown
        {interactive ? <ChevronDown size={12} /> : null}
      </span>
    );
  }

  const classes = stage.isWon
    ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
    : stage.isClosed
      ? "bg-red-50 text-red-700 ring-red-200"
      : "bg-violet-50 text-violet-700 ring-violet-200";

  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset transition",
        classes,
        interactive
          ? "cursor-pointer group-hover:brightness-95 group-hover:shadow-sm"
          : "",
      ].join(" ")}
    >
      {stage.name}

      {interactive ? <ChevronDown size={12} className="opacity-60" /> : null}
    </span>
  );
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

function formatAmount(value: string): string {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return value;
  }

  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,

    maximumFractionDigits: 2,
  }).format(numericValue);
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",

    month: "short",

    day: "numeric",
  }).format(new Date(value));
}
