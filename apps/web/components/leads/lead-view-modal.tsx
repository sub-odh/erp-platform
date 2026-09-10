"use client";

import {
  Archive,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Mail,
  Phone,
  Smartphone,
  UserRound,
} from "lucide-react";

import { Button, Modal } from "@/components/ui";

import { LeadStatusBadge } from "./lead-status-badge";

import type { Lead } from "@/types/lead";

interface LeadViewModalProps {
  open: boolean;

  lead: Lead | null;

  onClose: () => void;
}

export function LeadViewModal({ open, lead, onClose }: LeadViewModalProps) {
  if (!lead) {
    return null;
  }

  const archived = Boolean(lead.deletedAt);

  return (
    <Modal
      open={open}
      title="Lead details"
      description={
        archived
          ? "View this archived lead and its CRM history."
          : "View lead contact and sales information."
      }
      onClose={onClose}
      className="max-w-2xl"
      footer={
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="space-y-6">
        <div
          className={[
            "rounded-xl border p-5",
            archived
              ? "border-slate-200 bg-slate-50"
              : "border-blue-100 bg-blue-50/60",
          ].join(" ")}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm ring-1 ring-slate-200">
                <Building2 size={20} />
              </div>

              <div className="min-w-0">
                <h3 className="truncate text-lg font-semibold text-slate-900">
                  {lead.companyName || `${lead.firstName} ${lead.lastName}`}
                </h3>

                <p className="mt-1 text-sm text-slate-600">
                  {lead.firstName} {lead.lastName}
                </p>

                {lead.jobTitle ? (
                  <p className="mt-0.5 text-sm text-slate-500">
                    {lead.jobTitle}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-2">
              <LeadStatusBadge status={lead.status} />

              {archived ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700">
                  <Archive size={12} />
                  Archived
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <section>
          <h4 className="mb-3 text-xs font-semibold tracking-wide text-slate-500">
            Contact
          </h4>

          <div className="grid gap-4 sm:grid-cols-2">
            <Detail
              icon={<Mail size={16} />}
              label="Email"
              value={lead.email}
            />

            <Detail
              icon={<Phone size={16} />}
              label="Phone"
              value={lead.phone}
            />

            <Detail
              icon={<Smartphone size={16} />}
              label="Mobile"
              value={lead.mobile}
            />

            <Detail
              icon={<BriefcaseBusiness size={16} />}
              label="Source"
              value={lead.source}
            />
          </div>
        </section>

        <section>
          <h4 className="mb-3 text-xs font-semibold tracking-wide text-slate-500">
            Sales information
          </h4>

          <div className="grid gap-4 sm:grid-cols-2">
            <Detail
              icon={<Building2 size={16} />}
              label="Company"
              value={lead.companyName}
            />

            <Detail
              icon={<BriefcaseBusiness size={16} />}
              label="Job Title"
              value={lead.jobTitle}
            />

            <Detail
              icon={<UserRound size={16} />}
              label="Assigned To"
              value={lead.ownerUserId ? "Assigned" : "Unassigned"}
            />

            <Detail
              icon={<CalendarDays size={16} />}
              label="Converted"
              value={
                lead.convertedAt
                  ? formatDateTime(lead.convertedAt)
                  : "Not converted"
              }
            />
          </div>
        </section>

        {lead.notes ? (
          <section>
            <h4 className="mb-3 text-xs font-semibold tracking-wide text-slate-500">
              Notes
            </h4>

            <div className="whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
              {lead.notes}
            </div>
          </section>
        ) : null}

        <section>
          <h4 className="mb-3 text-xs font-semibold tracking-wide text-slate-500">
            Record information
          </h4>

          <div className="grid gap-4 sm:grid-cols-2">
            <Detail
              icon={<CalendarDays size={16} />}
              label="Created"
              value={formatDateTime(lead.createdAt)}
            />

            <Detail
              icon={<CalendarDays size={16} />}
              label="Last Updated"
              value={formatDateTime(lead.updatedAt)}
            />

            {lead.deletedAt ? (
              <Detail
                icon={<Archive size={16} />}
                label="Archived"
                value={formatDateTime(lead.deletedAt)}
              />
            ) : null}
          </div>
        </section>
      </div>
    </Modal>
  );
}

function Detail({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-400">
        {icon}

        {label}
      </div>

      <p className="mt-2 wrap-break-word text-sm font-medium text-slate-800">
        {value || "—"}
      </p>
    </div>
  );
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
