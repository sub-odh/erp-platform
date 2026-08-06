"use client";

import { Plus, Search, Users } from "lucide-react";
import { type FormEvent, useCallback, useEffect, useState } from "react";

import { ArchiveUserModal } from "@/components/users/archive-user-modal";
import { CreateUserModal } from "@/components/users/create-user-modal";
import { EditUserModal } from "@/components/users/edit-user-modal";
import { ResetUserPasswordModal } from "@/components/users/reset-user-password-modal";
import { UserTable } from "@/components/users/user-table";
import { getStoredUser } from "@/lib/auth";
import { getUsers, restoreUser, updateUserStatus } from "@/lib/users";
import type {
  User,
  UserListCounts,
  UserListPagination,
  UserListStatus,
} from "@/types/user";

const emptyCounts: UserListCounts = {
  active: 0,
  inactive: 0,
  archived: 0,
  total: 0,
};

const emptyPagination: UserListPagination = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
};

export default function UsersPage() {
  const currentUser = getStoredUser();

  const [users, setUsers] = useState<User[]>([]);

  const [searchInput, setSearchInput] = useState("");

  const [searchQuery, setSearchQuery] = useState("");

  const [status, setStatus] = useState<UserListStatus>("active");

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  const [counts, setCounts] = useState<UserListCounts>(emptyCounts);

  const [pagination, setPagination] =
    useState<UserListPagination>(emptyPagination);

  const [createModalOpen, setCreateModalOpen] = useState(false);

  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [resettingUser, setResettingUser] = useState<User | null>(null);

  const [archivingUser, setArchivingUser] = useState<User | null>(null);

  const loadUsers = useCallback(
    async (page = 1): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        const result = await getUsers({
          status,
          search: searchQuery || undefined,
          page,
          limit: 20,
          sortBy: "createdAt",
          sortDirection: "desc",
        });

        setUsers(result.data);
        setCounts(result.counts);
        setPagination(result.pagination);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load users",
        );
      } finally {
        setLoading(false);
      }
    },
    [searchQuery, status],
  );

  useEffect(() => {
    void loadUsers(1);
  }, [loadUsers]);

  function handleStatusChange(nextStatus: UserListStatus): void {
    if (nextStatus === status) {
      return;
    }

    setStatus(nextStatus);
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    const normalizedSearch = searchInput.trim();

    if (normalizedSearch === searchQuery) {
      void loadUsers(1);
      return;
    }

    setSearchQuery(normalizedSearch);
  }

  function handleClearSearch(): void {
    setSearchInput("");

    if (searchQuery) {
      setSearchQuery("");
    }
  }

  async function handleToggleStatus(user: User): Promise<void> {
    setBusyUserId(user.id);
    setError(null);

    try {
      await updateUserStatus(user.id, {
        isActive: !user.isActive,
      });

      await loadUsers(pagination.page);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update user",
      );
    } finally {
      setBusyUserId(null);
    }
  }

  async function handleRestore(user: User): Promise<void> {
    setBusyUserId(user.id);
    setError(null);

    try {
      await restoreUser(user.id);

      await loadUsers(pagination.page);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to restore user",
      );
    } finally {
      setBusyUserId(null);
    }
  }

  return (
    <>
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-blue-600 p-3 text-white">
              <Users size={24} />
            </div>

            <div>
              <p className="text-sm font-medium text-blue-600">
                Administration
              </p>

              <h1 className="text-3xl font-semibold text-slate-900">Users</h1>

              <p className="mt-2 text-slate-500">
                Manage organization access, roles, passwords, and account
                status.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition hover:bg-blue-700"
          >
            <Plus size={18} />
            Create user
          </button>
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          <StatusTab
            active={status === "active"}
            label="Active"
            count={counts.active}
            onClick={() => handleStatusChange("active")}
          />

          <StatusTab
            active={status === "inactive"}
            label="Inactive"
            count={counts.inactive}
            onClick={() => handleStatusChange("inactive")}
          />

          <StatusTab
            active={status === "archived"}
            label="Archived"
            count={counts.archived}
            onClick={() => handleStatusChange("archived")}
          />
        </div>

        <form
          onSubmit={handleSearchSubmit}
          className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="flex min-w-0 flex-1 items-center gap-3 rounded-lg border border-slate-300 px-3 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
              <Search size={18} className="shrink-0 text-slate-400" />

              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search by name, email, or role"
                className="w-full border-0 bg-transparent py-3 outline-none"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-slate-800 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Search
            </button>

            {searchInput || searchQuery ? (
              <button
                type="button"
                disabled={loading}
                onClick={handleClearSearch}
                className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Clear
              </button>
            ) : null}
          </div>
        </form>

        {error ? (
          <div className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
            <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-blue-600 border-r-transparent" />

            <p className="mt-4 text-sm text-slate-500">Loading users...</p>
          </div>
        ) : (
          <>
            <UserTable
              users={users}
              currentUserId={currentUser?.id ?? null}
              busyUserId={busyUserId}
              archivedView={status === "archived"}
              onEdit={setEditingUser}
              onResetPassword={setResettingUser}
              onToggleStatus={handleToggleStatus}
              onArchive={setArchivingUser}
              onRestore={handleRestore}
            />

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Showing {users.length} of {pagination.total} users · Page{" "}
                {pagination.page} of {Math.max(pagination.totalPages, 1)}
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={!pagination.hasPreviousPage || loading}
                  onClick={() => void loadUsers(pagination.page - 1)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>

                <button
                  type="button"
                  disabled={!pagination.hasNextPage || loading}
                  onClick={() => void loadUsers(pagination.page + 1)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <CreateUserModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={() => {
          setCreateModalOpen(false);
          void loadUsers(1);
        }}
      />

      <EditUserModal
        open={editingUser !== null}
        user={editingUser}
        onClose={() => setEditingUser(null)}
        onUpdated={() => {
          setEditingUser(null);
          void loadUsers(pagination.page);
        }}
      />

      <ResetUserPasswordModal
        open={resettingUser !== null}
        user={resettingUser}
        onClose={() => setResettingUser(null)}
      />

      <ArchiveUserModal
        open={archivingUser !== null}
        user={archivingUser}
        onClose={() => setArchivingUser(null)}
        onArchived={() => {
          setArchivingUser(null);
          void loadUsers(pagination.page);
        }}
      />
    </>
  );
}

function StatusTab({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition",
        active
          ? "bg-blue-600 text-white"
          : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
      ].join(" ")}
    >
      {label}

      <span
        className={[
          "rounded-full px-2 py-0.5 text-xs",
          active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600",
        ].join(" ")}
      >
        {count}
      </span>
    </button>
  );
}
