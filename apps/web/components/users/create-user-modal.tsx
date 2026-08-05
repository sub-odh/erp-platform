"use client";

import { FormEvent, useMemo, useState } from "react";

import { Button, Input, Modal, Select } from "@/components/ui";
import { getStoredUser } from "@/lib/auth";
import { createUser } from "@/lib/users";
import type { CreateUserRequest, User } from "@/types/user";

interface CreateUserModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (user: User) => void;
}

const initialForm: CreateUserRequest = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  role: "STAFF",
};

export function CreateUserModal({
  open,
  onClose,
  onCreated,
}: CreateUserModalProps) {
  const currentUser = getStoredUser();

  const [form, setForm] = useState<CreateUserRequest>(initialForm);

  const [error, setError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);

  const allowedRoles = useMemo(() => {
    if (currentUser?.role === "OWNER") {
      return ["ADMIN", "MANAGER", "STAFF"] as const;
    }

    return ["MANAGER", "STAFF"] as const;
  }, [currentUser?.role]);

  function updateField<Key extends keyof CreateUserRequest>(
    key: Key,
    value: CreateUserRequest[Key],
  ): void {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function resetAndClose(): void {
    if (submitting) {
      return;
    }

    setForm(initialForm);
    setError(null);
    onClose();
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    setError(null);

    if (form.password.length < 12) {
      setError("Password must contain at least 12 characters.");
      return;
    }

    setSubmitting(true);

    try {
      const created = await createUser({
        ...form,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
      });

      onCreated(created);
      setForm(initialForm);
      onClose();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to create user",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      title="Create user"
      description="Add a user to the current organization."
      onClose={resetAndClose}
      footer={
        <>
          <Button
            variant="outline"
            onClick={resetAndClose}
            disabled={submitting}
          >
            Cancel
          </Button>

          <Button type="submit" form="create-user-form" loading={submitting}>
            Create user
          </Button>
        </>
      }
    >
      <form id="create-user-form" onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="First name"
            value={form.firstName}
            onChange={(event) => updateField("firstName", event.target.value)}
            maxLength={100}
            required
          />

          <Input
            label="Last name"
            value={form.lastName}
            onChange={(event) => updateField("lastName", event.target.value)}
            maxLength={100}
            required
          />
        </div>

        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={(event) => updateField("email", event.target.value)}
          maxLength={320}
          required
        />

        <Input
          label="Temporary password"
          type="password"
          value={form.password}
          onChange={(event) => updateField("password", event.target.value)}
          minLength={12}
          maxLength={128}
          hint="Use at least 12 characters."
          required
        />

        <Select
          label="Role"
          value={form.role}
          onChange={(event) =>
            updateField("role", event.target.value as CreateUserRequest["role"])
          }
          required
        >
          {allowedRoles.map((role) => (
            <option key={role} value={role}>
              {role}
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
