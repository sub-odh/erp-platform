import { Power } from "lucide-react";

import { RoleBadge } from "@/components/users/role-badge";
import { StatusBadge } from "@/components/users/status-badge";
import type { User } from "@/types/user";

interface UserTableProps {
  users: User[];
  busyUserId: string | null;
  onToggleStatus: (user: User) => void;
}

export function UserTable({
  users,
  busyUserId,
  onToggleStatus,
}: UserTableProps) {
  if (users.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <p className="font-medium text-slate-700">No users found</p>

        <p className="mt-2 text-sm text-slate-500">
          Try changing your search or create a new user.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <TableHeader>Name</TableHeader>
              <TableHeader>Email</TableHeader>
              <TableHeader>Role</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader align="right">Actions</TableHeader>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {users.map((user) => (
              <tr key={user.id} className="transition hover:bg-slate-50">
                <td className="whitespace-nowrap px-5 py-4">
                  <p className="font-medium text-slate-900">
                    {user.firstName} {user.lastName}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Created {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </td>

                <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                  {user.email}
                </td>

                <td className="whitespace-nowrap px-5 py-4">
                  <RoleBadge role={user.role} />
                </td>

                <td className="whitespace-nowrap px-5 py-4">
                  <StatusBadge isActive={user.isActive} />
                </td>

                <td className="whitespace-nowrap px-5 py-4 text-right">
                  <button
                    type="button"
                    disabled={busyUserId === user.id || user.role === "OWNER"}
                    onClick={() => onToggleStatus(user)}
                    className={[
                      "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition",
                      user.isActive
                        ? "border-red-200 text-red-700 hover:bg-red-50"
                        : "border-green-200 text-green-700 hover:bg-green-50",
                      "disabled:cursor-not-allowed disabled:opacity-50",
                    ].join(" ")}
                  >
                    <Power size={16} />

                    {busyUserId === user.id
                      ? "Updating..."
                      : user.isActive
                        ? "Deactivate"
                        : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TableHeader({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      className={[
        "px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500",
        align === "right" ? "text-right" : "text-left",
      ].join(" ")}
    >
      {children}
    </th>
  );
}
