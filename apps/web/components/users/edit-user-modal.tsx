"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { Button, Input, Modal, Select } from "@/components/ui";
import { getStoredUser } from "@/lib/auth";
import { updateUser } from "@/lib/users";
import type { UpdateUserRequest, User, UserRole } from "@/types/user";

interface EditUserModalProps {
  open: boolean;
  user: User | null;
  onClose: () => void;
  onUpdated: (user: User) => void;
}

export function EditUserModal({
  open,
  user,
  onClose,
  onUpdated,
}: EditUserModalProps) {
  const currentUser = getStoredUser();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<Exclude<UserRole, "OWNER">>("STAFF");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }

    setFirstName(user.firstName);
    setLastName(user.lastName);

    if (user.role !== "OWNER") {
      setRole(user.role);
    }

    setError(null);
  }, [user]);

  const allowedRoles = useMemo(() => {
    if (currentUser?.role === "OWNER") {
      return ["ADMIN", "MANAGER", "STAFF"] as const;
    }

    return ["MANAGER", "STAFF"] as const;
  }, [currentUser?.role]);

  function handleClose(): void {
    if (submitting) {
      return;
    }

    setError(null);
    onClose();
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (!user) {
      return;
    }

    const normalizedFirstName = firstName.trim();
    const normalizedLastName = lastName.trim();

    if (!normalizedFirstName || !normalizedLastName) {
      setError("First name and last name are required.");
      return;
    }

    const payload: UpdateUserRequest = {
      firstName: normalizedFirstName,
      lastName: normalizedLastName,
      role,
    };

    setSubmitting(true);
    setError(null);

    try {
      const updated = await updateUser(user.id, payload);
      onUpdated(updated);
      onClose();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update user",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      title="Edit user"
      description="Update the user's name and role."
      onClose={handleClose}
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>

          <Button type="submit" form="edit-user-form" loading={submitting}>
            Save changes
          </Button>
        </>
      }
    >
      <form id="edit-user-form" onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="First name"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            maxLength={100}
            required
          />

          <Input
            label="Last name"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            maxLength={100}
            required
          />
        </div>

        <Input
          label="Email"
          value={user?.email ?? ""}
          disabled
          hint="Email changes are not supported yet."
        />

        <Select
          label="Role"
          value={role}
          onChange={(event) =>
            setRole(event.target.value as Exclude<UserRole, "OWNER">)
          }
          required
        >
          {allowedRoles.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>

        {error ? (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}
      </form>
    </Modal>
  );
}
