import type { OpportunityStatus } from "@/types/opportunity";

interface OpportunityStatusBadgeProps {
  status: OpportunityStatus;
}

export function OpportunityStatusBadge({
  status,
}: OpportunityStatusBadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
        getClasses(status),
      ].join(" ")}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />

      {formatStatus(status)}
    </span>
  );
}

function getClasses(status: OpportunityStatus): string {
  switch (status) {
    case "OPEN":
      return "bg-blue-50 text-blue-700 ring-blue-200";

    case "WON":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";

    case "LOST":
      return "bg-red-50 text-red-700 ring-red-200";

    default:
      return "bg-slate-100 text-slate-600 ring-slate-200";
  }
}

function formatStatus(status: OpportunityStatus): string {
  return status
    .toLowerCase()
    .replace(/(^|\s)\S/g, (value) => value.toUpperCase());
}
