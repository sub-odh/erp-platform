"use client";

import { Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button, Input, Modal } from "@/components/ui";
import {
  createEmployeeRole,
  deleteEmployeeRole,
  getEmployeeRoles,
} from "@/lib/users";
import type { EmployeeRole } from "@/types/user";

export function EmployeeRolesModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [roles, setRoles] = useState<EmployeeRole[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setRoles(await getEmployeeRoles());
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load employee roles.",
      );
    }
  }, []);

  useEffect(() => {
    if (open) {
      setError(null);
      void load();
    }
  }, [load, open]);

  async function addRole() {
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await createEmployeeRole(name.trim());
      setName("");
      await load();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to add employee role.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function removeRole(role: EmployeeRole) {
    if (
      !window.confirm(
        `Delete the ${role.name} employee role? Reassign employees first if it is in use.`,
      )
    )
      return;
    setBusy(true);
    setError(null);
    try {
      await deleteEmployeeRole(role.id);
      await load();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete employee role.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      title="Employee Roles"
      description="Company job titles such as CEO, COO, HR, or Storekeeper. They do not change platform access."
      onClose={onClose}
      footer={
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="flex gap-2">
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Accountant"
          maxLength={100}
        />
        <Button onClick={() => void addRole()} disabled={busy || !name.trim()}>
          <Plus size={16} /> Add
        </Button>
      </div>
      {error ? (
        <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      <div className="mt-5 max-h-72 space-y-2 overflow-y-auto">
        {roles.map((role) => (
          <div
            key={role.id}
            className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2"
          >
            <span className="text-sm font-medium text-slate-700">
              {role.name}
            </span>
            <Button
              size="icon"
              variant="ghost"
              title={`Delete ${role.name}`}
              disabled={busy}
              className="text-red-600 hover:bg-red-50"
              onClick={() => void removeRole(role)}
            >
              <Trash2 size={16} />
            </Button>
          </div>
        ))}
      </div>
    </Modal>
  );
}
