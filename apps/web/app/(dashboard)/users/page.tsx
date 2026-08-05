"use client";

import { Plus, Search, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { CreateUserModal } from "@/components/users/create-user-modal";
import { UserTable } from "@/components/users/user-table";
import { getUsers, updateUserStatus } from "@/lib/users";
import type { User } from "@/types/user";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  const [createModalOpen, setCreateModalOpen] = useState(false);

  useEffect(() => {
    void loadUsers();
  }, []);

  async function loadUsers(): Promise<void> {
    setLoading(true);
    setError(null);

    try {
      const result = await getUsers();
      setUsers(result);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load users",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleStatus(user: User): Promise<void> {
    setBusyUserId(user.id);
    setError(null);

    try {
      const updated = await updateUserStatus(user.id, {
        isActive: !user.isActive,
      });

      setUsers((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
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

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return users;
    }

    return users.filter((user) => {
      const name = `${user.firstName} ${user.lastName}`.toLowerCase();

      return (
        name.includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.role.toLowerCase().includes(term)
      );
    });
  }, [search, users]);

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
                Manage organization access, roles, and account status.
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

        <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <label className="flex items-center gap-3 rounded-lg border border-slate-300 px-3 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
            <Search size={18} className="text-slate-400" />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, email, or role"
              className="w-full border-0 bg-transparent py-3 outline-none"
            />
          </label>
        </div>

        {error ? (
          <div className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
            <p className="text-sm text-slate-500">Loading users...</p>
          </div>
        ) : (
          <UserTable
            users={filteredUsers}
            busyUserId={busyUserId}
            onToggleStatus={handleToggleStatus}
          />
        )}
      </div>

      <CreateUserModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={(createdUser) => {
          setUsers((current) => [createdUser, ...current]);

          setCreateModalOpen(false);
        }}
      />
    </>
  );
}
