import { RotateCcw, Trash2 } from "lucide-react";

import { Avatar } from "@/components/users/avatar";
import { RoleBadge } from "@/components/users/role-badge";
import { StatusBadge } from "@/components/users/status-badge";
import { UserActionsMenu } from "@/components/users/user-actions-menu";
import type { User, UserRole } from "@/types/user";

interface UserTableProps {
  users: User[];
  currentUserId: string | null;
  currentUserRole: UserRole | null;
  busyUserId: string | null;
  archivedView: boolean;
  onEdit: (user: User) => void;
  onResetPassword: (user: User) => void;
  onToggleStatus: (user: User) => void;
  onArchive: (user: User) => void;
  onDelete: (user: User) => void;
  onRestore: (user: User) => void;
}

export function UserTable({
  users,
  currentUserId,
  currentUserRole,
  busyUserId,
  archivedView,
  onEdit,
  onResetPassword,
  onToggleStatus,
  onArchive,
  onDelete,
  onRestore,
}: UserTableProps) {
  if (users.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <p className="font-medium text-slate-700">
          {archivedView ? "No archived users" : "No users found"}
        </p>

        <p className="mt-2 text-sm text-slate-500">
          {archivedView
            ? "Archived users will appear here."
            : "Try changing your search or create a new user."}
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
              <TableHeader>User</TableHeader>
              <TableHeader>Employee ID</TableHeader>
              <TableHeader>Email</TableHeader>
              <TableHeader>Role</TableHeader>
              <TableHeader>Last login</TableHeader>
              <TableHeader>{archivedView ? "Archived" : "Status"}</TableHeader>
              <TableHeader align="right">Actions</TableHeader>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {users.map((user) => {
              const isBusy = busyUserId === user.id;

              return (
                <tr key={user.id} className="transition hover:bg-slate-50">
                  <td className="whitespace-nowrap px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar
                        firstName={user.firstName}
                        lastName={user.lastName}
                        src={user.avatarUrl}
                        size="md"
                      />

                      <div>
                        <p className="font-medium text-slate-900">
                          {user.firstName} {user.lastName}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Created {formatDate(user.createdAt)}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-slate-600">
                    {user.employeeId ?? "—"}
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                    {user.email}
                  </td>

                  <td className="whitespace-nowrap px-5 py-4">
                    <RoleBadge role={user.role} />
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                    {user.lastLoginAt
                      ? formatDateTime(user.lastLoginAt)
                      : "Never"}
                  </td>

                  <td className="whitespace-nowrap px-5 py-4">
                    {archivedView ? (
                      <span className="inline-flex rounded-full bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700">
                        {user.deletedAt
                          ? formatDate(user.deletedAt)
                          : "Archived"}
                      </span>
                    ) : (
                      <StatusBadge isActive={user.isActive} />
                    )}
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 text-right">
                    {archivedView ? (
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => onRestore(user)}
                          className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 px-3 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <RotateCcw size={16} />

                          {isBusy ? "Working..." : "Restore"}
                        </button>

                        {currentUserRole === "OWNER" &&
                        user.id !== currentUserId &&
                        user.role !== "OWNER" ? (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => onDelete(user)}
                            className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Trash2 size={16} /> Delete
                          </button>
                        ) : null}
                      </div>
                    ) : (
                      <UserActionsMenu
                        user={user}
                        currentUserId={currentUserId}
                        currentUserRole={currentUserRole}
                        busy={isBusy}
                        onEdit={onEdit}
                        onResetPassword={onResetPassword}
                        onToggleStatus={onToggleStatus}
                        onArchive={onArchive}
                        onDelete={onDelete}
                      />
                    )}
                  </td>
                </tr>
              );
            })}
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

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
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
