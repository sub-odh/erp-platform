import type { LeadStatus } from "@/types/lead";

interface LeadStatusBadgeProps {
  status: LeadStatus;
}

export function LeadStatusBadge({ status }: LeadStatusBadgeProps) {
  const classes = getClasses(status);

  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        classes,
      ].join(" ")}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />

      {formatStatus(status)}
    </span>
  );
}

function getClasses(status: LeadStatus): string {
  switch (status) {
    case "NEW":
      return "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200";

    case "CONTACTED":
      return "bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200";

    case "QUALIFIED":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200";

    case "DISQUALIFIED":
      return "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200";

    case "CONVERTED":
      return "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200";

    default:
      return "bg-slate-100 text-slate-600";
  }
}

function formatStatus(status: LeadStatus): string {
  return status
    .toLowerCase()
    .replace(/(^|\s)\S/g, (value) => value.toUpperCase());
}
