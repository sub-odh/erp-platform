"use client";

import { Button, Modal } from "@/components/ui";
import { formatCurrency } from "@/lib/currency";
import { formatCalendarDate, type CalendarSystem } from "@/lib/nepali-date";
import type { Guarantee } from "@/types/procurement";

interface GuaranteeDetailViewProps {
  guarantee: Guarantee | null;
  system: CalendarSystem;
  onClose: () => void;
  onViewDocument: (guarantee: Guarantee) => void;
}

export function GuaranteeDetailView({
  guarantee,
  system,
  onClose,
  onViewDocument,
}: GuaranteeDetailViewProps) {
  const days = guarantee ? daysUntil(guarantee.expiryDate) : 0;

  return (
    <Modal
      open={Boolean(guarantee)}
      title="Full Guarantee Profile Node"
      onClose={onClose}
      className="max-w-lg"
    >
      {guarantee ? (
        <div className="space-y-3 text-sm">
          <DetailRow label="Type" value={guarantee.guaranteeType} />
          <DetailRow label="Client Name" value={guarantee.clientName} />
          <DetailRow
            label="Financial Valuation"
            value={formatCurrency(guarantee.amount)}
          />
          <DetailRow label="Bank Node" value={guarantee.bankNameBranch} />
          <DetailRow
            label="Submission Date"
            value={formatCalendarDate(guarantee.submissionDate, system)}
          />
          <DetailRow
            label="Expiry Date"
            value={formatCalendarDate(guarantee.expiryDate, system)}
          />
          <DetailRow
            label="Horizon Status"
            value={
              guarantee.status === "RELEASED"
                ? "Released"
                : days < 0
                  ? "Expired"
                  : `${days} days left`
            }
          />
          <DetailRow
            label="Assigned Officer"
            value={guarantee.assignedPerson ?? "—"}
          />
          <DetailRow label="Tender Project Scope" value={guarantee.tenderDetails} />
          {guarantee.status === "RELEASED" ? (
            <DetailRow
              label="Release Details"
              value={`${guarantee.releaseDate ? formatCalendarDate(guarantee.releaseDate, system) : "Released"}${
                guarantee.releaseRemarks ? `. ${guarantee.releaseRemarks}` : ""
              }`}
            />
          ) : null}
          {guarantee.documentUrl ? (
            <Button
              variant="outline"
              onClick={() => onViewDocument(guarantee)}
            >
              {/\.pdf($|\?)/i.test(guarantee.documentUrl)
                ? "Launch PDF Canvas Viewer"
                : "View Document"}
            </Button>
          ) : null}
        </div>
      ) : null}
    </Modal>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[38%_1fr] gap-2 border-b border-slate-100 pb-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="text-slate-800">{value}</p>
    </div>
  );
}

function daysUntil(expiryDate: string): number {
  const end = new Date(`${expiryDate}T12:00:00`);
  const start = new Date();
  start.setHours(12, 0, 0, 0);
  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}
