import type { UserRole } from "@/types/user";

const roleStyles: Record<UserRole, string> = {
  OWNER: "bg-purple-100 text-purple-700",
  ADMIN: "bg-blue-100 text-blue-700",
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
      {role}
    </span>
  );
}
