"use client";

import {
  Building2,
  Mail,
  MoreHorizontal,
  Pencil,
  Phone,
  Trash2,
} from "lucide-react";

import { useEffect, useRef, useState } from "react";

import { LeadStatusBadge } from "./lead-status-badge";

import type { Lead } from "@/types/lead";

interface LeadTableProps {
  leads: Lead[];

  onEdit: (lead: Lead) => void;

  onArchive: (lead: Lead) => void;
}

interface MenuPosition {
  top: number;
  right: number;
}

export function LeadTable({ leads, onEdit, onArchive }: LeadTableProps) {
  const [menuLead, setMenuLead] = useState<Lead | null>(null);

  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuLead) {
      return;
    }

    function close(): void {
      setMenuLead(null);
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
  }, [menuLead]);

  function openMenu(lead: Lead, button: HTMLButtonElement): void {
    if (menuLead?.id === lead.id) {
      setMenuLead(null);
      setMenuPosition(null);

      return;
    }

    const rect = button.getBoundingClientRect();

    setMenuLead(lead);

    setMenuPosition({
      top: rect.bottom + 8,

      right: Math.max(12, window.innerWidth - rect.right),
    });
  }

  if (leads.length === 0) {
    return (
      <div className="border-t border-slate-200 bg-white px-6 py-16 text-center">
        <p className="font-medium text-slate-700">No leads found</p>

        <p className="mt-1 text-sm text-slate-500">
          Add a new lead to start building your sales pipeline.
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

              <Header>Status</Header>

              <Header>Source</Header>

              <Header>Assigned To</Header>

              <Header>Created</Header>

              <Header align="right">Action</Header>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {leads.map((lead) => (
              <tr key={lead.id} className="transition hover:bg-slate-50">
                <td className="px-6 py-4">
                  <div className="flex gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <Building2 size={17} />
                    </div>

                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">
                        {lead.companyName ||
                          `${lead.firstName} ${lead.lastName}`}
                      </p>

                      {lead.companyName ? (
                        <p className="mt-0.5 text-sm text-slate-600">
                          {lead.firstName} {lead.lastName}
                        </p>
                      ) : null}

                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
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
                      </div>
                    </div>
                  </div>
                </td>

                <td className="whitespace-nowrap px-6 py-4">
                  <LeadStatusBadge status={lead.status} />
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

                <td className="whitespace-nowrap px-6 py-4 text-right">
                  <button
                    type="button"
                    onClick={(event) => openMenu(lead, event.currentTarget)}
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    aria-label={`Actions for ${lead.firstName} ${lead.lastName}`}
                  >
                    <MoreHorizontal size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {menuLead && menuPosition ? (
        <div
          ref={menuRef}
          className="fixed z-100 w-44 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-xl"
          style={{
            top: menuPosition.top,
            right: menuPosition.right,
          }}
        >
          <button
            type="button"
            onClick={() => {
              const lead = menuLead;

              setMenuLead(null);

              onEdit(lead);
            }}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
          >
            <Pencil size={15} />
            Edit lead
          </button>

          <button
            type="button"
            onClick={() => {
              const lead = menuLead;

              setMenuLead(null);

              onArchive(lead);
            }}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
          >
            <Trash2 size={15} />
            Archive
          </button>
        </div>
      ) : null}
    </>
  );
}

function Header({
  children,
  align = "left",
}: {
  children: React.ReactNode;

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
