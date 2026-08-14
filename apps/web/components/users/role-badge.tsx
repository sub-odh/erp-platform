import type { UserRole } from "@/types/user";
import { ROLE_LABELS } from "@/lib/user-roles";

const roleStyles: Record<UserRole, string> = {
  OWNER: "bg-purple-100 text-purple-700",
  SUPER_ADMIN: "bg-fuchsia-100 text-fuchsia-700",
  ADMIN: "bg-blue-100 text-blue-700",
  HR: "bg-pink-100 text-pink-700",
  OPERATIONS: "bg-cyan-100 text-cyan-700",
  EMPLOYEE: "bg-slate-100 text-slate-700",
  SALES: "bg-emerald-100 text-emerald-700",
  MANAGEMENT: "bg-indigo-100 text-indigo-700",
  HEAD: "bg-violet-100 text-violet-700",
  MANAGER: "bg-amber-100 text-amber-700",
  STAFF: "bg-slate-100 text-slate-700",
};

export function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span
      className={[
        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
        roleStyles[role],
      ].join(" ")}
    >
      {ROLE_LABELS[role]}
    </span>
  );
}
