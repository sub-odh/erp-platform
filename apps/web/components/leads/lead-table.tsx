"use client";

import {
  Archive,
  ArrowRightCircle,
  Building2,
  Check,
  Eye,
  Loader2,
  Mail,
  MoreHorizontal,
  Pencil,
  Phone,
  RotateCcw,
  Trash2,
} from "lucide-react";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { LeadStatusBadge } from "./lead-status-badge";

import type { EditableLeadStatus, Lead, LeadRecordState } from "@/types/lead";

interface LeadTableProps {
  leads: Lead[];

  recordState: LeadRecordState;

  canPermanentlyDelete: boolean;

  busyLeadId?: string | null;

  onView: (lead: Lead) => void;

  onEdit: (lead: Lead) => void;

  onConvert: (lead: Lead) => void;

  onArchive: (lead: Lead) => void;

  onRestore: (lead: Lead) => void;

  onPermanentDelete: (lead: Lead) => void;

  onChangeStatus: (lead: Lead, status: EditableLeadStatus) => Promise<void>;
}

interface MenuPosition {
  top: number;
  right: number;
}

const STATUS_OPTIONS: {
  value: EditableLeadStatus;
  label: string;
}[] = [
  {
    value: "NEW",
    label: "New",
  },
  {
    value: "CONTACTED",
    label: "Contacted",
  },
  {
    value: "QUALIFIED",
    label: "Qualified",
  },
  {
    value: "DISQUALIFIED",
    label: "Disqualified",
  },
];

export function LeadTable({
  leads,
  recordState,
  canPermanentlyDelete,
  busyLeadId,
  onView,
  onEdit,
  onConvert,
  onArchive,
  onRestore,
  onPermanentDelete,
  onChangeStatus,
}: LeadTableProps) {
  const [menuLead, setMenuLead] = useState<Lead | null>(null);

  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);

  const [statusLead, setStatusLead] = useState<Lead | null>(null);

  const [statusPosition, setStatusPosition] = useState<MenuPosition | null>(
    null,
  );

  const [changingStatus, setChangingStatus] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  const statusMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuLead && !statusLead) {
      return;
    }

    function closeAll(): void {
      setMenuLead(null);
      setMenuPosition(null);
      setStatusLead(null);
      setStatusPosition(null);
    }

    function handleClick(event: MouseEvent): void {
      const target = event.target as Node;

      const insideAction = menuRef.current?.contains(target);

      const insideStatus = statusMenuRef.current?.contains(target);

      if (!insideAction && !insideStatus) {
        closeAll();
      }
    }

    function handleKey(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        closeAll();
      }
    }

    window.addEventListener("scroll", closeAll, true);

    window.addEventListener("resize", closeAll);

    document.addEventListener("mousedown", handleClick);

    document.addEventListener("keydown", handleKey);

    return () => {
      window.removeEventListener("scroll", closeAll, true);

      window.removeEventListener("resize", closeAll);

      document.removeEventListener("mousedown", handleClick);

      document.removeEventListener("keydown", handleKey);
    };
  }, [menuLead, statusLead]);

  function closeActionMenu(): void {
    setMenuLead(null);
    setMenuPosition(null);
  }

  function closeStatusMenu(): void {
    setStatusLead(null);
    setStatusPosition(null);
  }

  function openMenu(lead: Lead, button: HTMLButtonElement): void {
    closeStatusMenu();

    if (menuLead?.id === lead.id) {
      closeActionMenu();

      return;
    }

    const rect = button.getBoundingClientRect();

    const archived = Boolean(lead.deletedAt);

    let menuHeight = 150;

    if (archived) {
      menuHeight = canPermanentlyDelete ? 150 : 105;
    } else if (lead.status === "QUALIFIED") {
      menuHeight = 200;
    }

    const preferredTop = rect.bottom + 8;

    const top =
      preferredTop + menuHeight > window.innerHeight - 12
        ? Math.max(12, rect.top - menuHeight - 8)
        : preferredTop;

    setMenuLead(lead);

    setMenuPosition({
      top,

      right: Math.max(12, window.innerWidth - rect.right),
    });
  }

  function openStatusMenu(lead: Lead, button: HTMLButtonElement): void {
    if (lead.deletedAt || lead.status === "CONVERTED") {
      return;
    }

    closeActionMenu();

    if (statusLead?.id === lead.id) {
      closeStatusMenu();

      return;
    }

    const rect = button.getBoundingClientRect();

    const menuHeight = 180;

    const preferredTop = rect.bottom + 8;

    const top =
      preferredTop + menuHeight > window.innerHeight - 12
        ? Math.max(12, rect.top - menuHeight - 8)
        : preferredTop;

    setStatusLead(lead);

    setStatusPosition({
      top,

      right: Math.max(12, window.innerWidth - rect.right),
    });
  }

  async function handleStatusSelect(status: EditableLeadStatus): Promise<void> {
    if (!statusLead) {
      return;
    }

    if (statusLead.status === status) {
      closeStatusMenu();

      return;
    }

    const lead = statusLead;

    setChangingStatus(true);

    try {
      await onChangeStatus(lead, status);

      closeStatusMenu();
    } finally {
      setChangingStatus(false);
    }
  }

  if (leads.length === 0) {
    return (
      <div className="border-t border-slate-200 bg-white px-6 py-16 text-center">
        <p className="font-medium text-slate-700">
          {recordState === "archived"
            ? "No archived leads found"
            : "No leads found"}
        </p>

        <p className="mt-1 text-sm text-slate-500">
          {recordState === "archived"
            ? "Archived leads will appear here."
            : "Add a new lead to start building your sales pipeline."}
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
              <Header>Company & Contact</Header>

              <Header>Source</Header>

              <Header>Assigned To</Header>

              <Header>Created</Header>

              <Header>Status</Header>

              <Header align="right">Action</Header>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {leads.map((lead) => {
              const archived = Boolean(lead.deletedAt);

              const busy = busyLeadId === lead.id;

              return (
                <tr
                  key={lead.id}
                  className={[
                    "transition hover:bg-slate-50",
                    archived ? "bg-slate-50/50" : "",
                  ].join(" ")}
                >
                  <td className="px-6 py-4">
                    <div className="flex gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        <Building2 size={17} />
                      </div>

                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => onView(lead)}
                          className="text-left"
                        >
                          <span className="font-semibold text-slate-900 transition hover:text-blue-600">
                            {lead.companyName ||
                              `${lead.firstName} ${lead.lastName}`}
                          </span>
                        </button>

                        {lead.companyName ? (
                          <p className="mt-0.5 text-sm text-slate-600">
                            {lead.firstName} {lead.lastName}
                          </p>
                        ) : null}

                        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                          {lead.email ? (
                            <span className="inline-flex items-center gap-1">
                              <Mail size={12} />

                              {lead.email}
                            </span>
                          ) : null}

                          {lead.phone ? (
                            <span className="inline-flex items-center gap-1">
                              <Phone size={12} />

                              {lead.phone}
                            </span>
                          ) : null}

                          {archived ? (
                            <span className="inline-flex items-center gap-1 font-medium text-slate-500">
                              <Archive size={12} />
                              Archived
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                    {lead.source ?? "—"}
                  </td>

                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                    {lead.ownerUserId ? "Assigned" : "Unassigned"}
                  </td>

                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                    {formatDate(lead.createdAt)}
                  </td>

                  <td className="whitespace-nowrap px-6 py-4">
                    {archived || lead.status === "CONVERTED" ? (
                      <LeadStatusBadge status={lead.status} />
                    ) : (
                      <button
                        type="button"
                        disabled={busy}
                        onMouseDown={(event) => event.stopPropagation()}
                        onClick={(event) =>
                          openStatusMenu(lead, event.currentTarget)
                        }
                        title="Click to change lead status"
                        className="group inline-flex rounded-full outline-none transition focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 disabled:opacity-50"
                      >
                        <LeadStatusBadge status={lead.status} interactive />
                      </button>
                    )}
                  </td>

                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={(event) => openMenu(lead, event.currentTarget)}
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                      aria-label={`Actions for ${lead.firstName} ${lead.lastName}`}
                    >
                      {busy ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <MoreHorizontal size={18} />
                      )}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {statusLead && statusPosition ? (
        <div
          ref={statusMenuRef}
          className="fixed z-100 w-48 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-xl"
          style={{
            top: statusPosition.top,

            right: statusPosition.right,
          }}
        >
          <div className="border-b border-slate-100 px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Change status
            </p>
          </div>

          {STATUS_OPTIONS.map((option) => {
            const selected = statusLead.status === option.value;

            return (
              <button
                key={option.value}
                type="button"
                disabled={changingStatus}
                onClick={() => void handleStatusSelect(option.value)}
                className={[
                  "flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition",

                  selected
                    ? "bg-blue-50 font-medium text-blue-700"
                    : "text-slate-700 hover:bg-slate-50",

                  changingStatus ? "cursor-wait opacity-60" : "",
                ].join(" ")}
              >
                <span>{option.label}</span>

                {selected ? <Check size={15} /> : null}
              </button>
            );
          })}

          {changingStatus ? (
            <div className="flex items-center gap-2 border-t border-slate-100 px-4 py-2 text-xs text-slate-500">
              <Loader2 size={13} className="animate-spin" />
              Updating...
            </div>
          ) : null}
        </div>
      ) : null}

      {menuLead && menuPosition ? (
        <div
          ref={menuRef}
          className="fixed z-100 w-56 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-xl"
          style={{
            top: menuPosition.top,

            right: menuPosition.right,
          }}
        >
          <button
            type="button"
            onClick={() => {
              const lead = menuLead;

              closeActionMenu();

              onView(lead);
            }}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50"
          >
            <Eye size={15} />
            View details
          </button>

          {menuLead.deletedAt ? (
            <>
              <button
                type="button"
                onClick={() => {
                  const lead = menuLead;

                  closeActionMenu();

                  onRestore(lead);
                }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium text-emerald-700 transition hover:bg-emerald-50"
              >
                <RotateCcw size={15} />
                Restore
              </button>

              {canPermanentlyDelete ? (
                <button
                  type="button"
                  onClick={() => {
                    const lead = menuLead;

                    closeActionMenu();

                    onPermanentDelete(lead);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-600 transition hover:bg-red-50"
                >
                  <Trash2 size={15} />
                  Delete permanently
                </button>
              ) : null}
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  const lead = menuLead;

                  closeActionMenu();

                  onEdit(lead);
                }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50"
              >
                <Pencil size={15} />
                Edit lead
              </button>

              {menuLead.status === "QUALIFIED" ? (
                <button
                  type="button"
                  onClick={() => {
                    const lead = menuLead;

                    closeActionMenu();

                    onConvert(lead);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium text-blue-700 transition hover:bg-blue-50"
                >
                  <ArrowRightCircle size={15} />
                  Convert to Opportunity
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => {
                  const lead = menuLead;

                  closeActionMenu();

                  onArchive(lead);
                }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-600 transition hover:bg-red-50"
              >
                <Archive size={15} />
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
        "px-6 py-4 text-sm font-bold uppercase text-slate-900",

        align === "right" ? "text-right" : "text-left",
      ].join(" ")}
    >
      {children}
    </th>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}
