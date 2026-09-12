import type { EmployeeStatus } from "@/types/employee";

export function EmployeeStatusBadge({ status }: { status: EmployeeStatus }) {
  const active = status === "ACTIVE";

  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        active
          ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200"
          : "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200",
      ].join(" ")}
    >
      <span
        className={[
          "mr-1.5 h-1.5 w-1.5 rounded-full",
          active ? "bg-emerald-500" : "bg-slate-400",
        ].join(" ")}
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
}
