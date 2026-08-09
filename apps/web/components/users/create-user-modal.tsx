"use client";

import { type FormEvent, useMemo, useState } from "react";

import { ImageUploader } from "@/components/media/image-uploader";
import { Button, Input, Modal, Select } from "@/components/ui";
import { getStoredUser } from "@/lib/auth";
import { createUser, uploadUserAvatar } from "@/lib/users";
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

  const [pendingAvatar, setPendingAvatar] = useState<File | null>(null);

  const [createdWithoutAvatar, setCreatedWithoutAvatar] = useState<User | null>(
    null,
  );

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

  function clearForm(): void {
    setForm(initialForm);
    setPendingAvatar(null);
    setCreatedWithoutAvatar(null);
    setError(null);
  }

  function resetAndClose(): void {
    if (submitting) {
      return;
    }

    if (createdWithoutAvatar) {
      onCreated(createdWithoutAvatar);
    }

    clearForm();
    onClose();
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (createdWithoutAvatar) {
      resetAndClose();
      return;
    }

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

      let finalUser = created;

      if (pendingAvatar) {
        try {
          finalUser = await uploadUserAvatar(created.id, pendingAvatar);
        } catch (avatarError) {
          setCreatedWithoutAvatar(created);

          setError(
            avatarError instanceof Error
              ? `User was created, but the profile picture could not be uploaded: ${avatarError.message}`
              : "User was created, but the profile picture could not be uploaded. You can add it later from Edit user.",
          );

          return;
        }
      }

      onCreated(finalUser);

      clearForm();
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

  const userAlreadyCreated = Boolean(createdWithoutAvatar);

  return (
    <Modal
      open={open}
      title="Create user"
      description="Add a user to the current organization."
      onClose={resetAndClose}
      className="max-w-2xl"
      footer={
        userAlreadyCreated ? (
          <Button onClick={resetAndClose}>Done</Button>
        ) : (
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
        )
      }
    >
      <form id="create-user-form" onSubmit={handleSubmit} className="space-y-6">
        <div className="flex justify-center">
          <ImageUploader
            preset="avatar"
            deferUpload
            disabled={submitting || userAlreadyCreated}
            onCroppedFileChange={setPendingAvatar}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="First name"
            value={form.firstName}
            onChange={(event) => updateField("firstName", event.target.value)}
            maxLength={100}
            disabled={userAlreadyCreated}
            required
          />

          <Input
            label="Last name"
            value={form.lastName}
            onChange={(event) => updateField("lastName", event.target.value)}
            maxLength={100}
            disabled={userAlreadyCreated}
            required
          />
        </div>

        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={(event) => updateField("email", event.target.value)}
          maxLength={320}
          disabled={userAlreadyCreated}
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
          disabled={userAlreadyCreated}
          required
        />

        <Select
          label="Role"
          value={form.role}
          onChange={(event) =>
            updateField("role", event.target.value as CreateUserRequest["role"])
          }
          disabled={userAlreadyCreated}
          required
        >
          {allowedRoles.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </Select>

        {error ? (
          <div
            className={[
              "rounded-lg px-4 py-3 text-sm",
              userAlreadyCreated
                ? "bg-amber-50 text-amber-800"
                : "bg-red-50 text-red-700",
            ].join(" ")}
          >
            {error}
          </div>
        ) : null}
      </form>
    </Modal>
  );
}
