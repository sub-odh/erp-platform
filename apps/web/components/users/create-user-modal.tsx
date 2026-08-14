"use client";

import { type FormEvent, useMemo, useState } from "react";

import { ImageUploader } from "@/components/media/image-uploader";
import { PasswordRequirements } from "@/components/security/password-requirements";

import { Button, Input, Modal, Select } from "@/components/ui";

import { getStoredUser } from "@/lib/auth";

import {
  isStrongPassword,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_POLICY_MESSAGE,
} from "@/lib/password-policy";

import { createUser, uploadUserAvatar } from "@/lib/users";

import { getAssignableRoles, ROLE_LABELS } from "@/lib/user-roles";

import type { CreateUserRequest, User } from "@/types/user";

interface CreateUserModalProps {
  open: boolean;

  onClose: () => void;

  onCreated: (user: User) => void;
}

const initialForm: CreateUserRequest = {
  employeeId: "",

  firstName: "",

  lastName: "",

  email: "",

  password: "",

  role: "EMPLOYEE",
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

  const allowedRoles = useMemo(
    () => getAssignableRoles(currentUser?.role),
    [currentUser?.role],
  );

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

    if (!isStrongPassword(form.password)) {
      setError(PASSWORD_POLICY_MESSAGE);

      return;
    }

    setSubmitting(true);

    try {
      const created = await createUser({
        ...form,

        employeeId: form.employeeId.trim().toUpperCase(),

        firstName: form.firstName.trim(),

        lastName: form.lastName.trim(),

        email: form.email.trim().toLowerCase(),
      });

      let finalUser = created;

      if (pendingAvatar) {
        try {
          finalUser = await uploadUserAvatar(
            created.id,

            pendingAvatar,
          );
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
      description="Add an employee login and access role to this company."
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
            label="Employee ID"
            value={form.employeeId}
            onChange={(event) => updateField("employeeId", event.target.value)}
            maxLength={50}
            disabled={userAlreadyCreated}
            required
          />

          <div className="hidden sm:block" />

          <Input
            label="First name"
            value={form.firstName}
            onChange={(event) =>
              updateField(
                "firstName",

                event.target.value,
              )
            }
            maxLength={100}
            disabled={userAlreadyCreated}
            required
          />

          <Input
            label="Last name"
            value={form.lastName}
            onChange={(event) =>
              updateField(
                "lastName",

                event.target.value,
              )
            }
            maxLength={100}
            disabled={userAlreadyCreated}
            required
          />
        </div>

        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={(event) =>
            updateField(
              "email",

              event.target.value,
            )
          }
          maxLength={320}
          disabled={userAlreadyCreated}
          required
        />

        <div className="space-y-3">
          <Input
            label="Temporary password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={(event) =>
              updateField(
                "password",

                event.target.value,
              )
            }
            minLength={PASSWORD_MIN_LENGTH}
            maxLength={PASSWORD_MAX_LENGTH}
            disabled={userAlreadyCreated}
            required
          />

          {!userAlreadyCreated ? (
            <PasswordRequirements password={form.password} />
          ) : null}
        </div>

        <Select
          label="Role"
          value={form.role}
          onChange={(event) =>
            updateField(
              "role",

              event.target.value as CreateUserRequest["role"],
            )
          }
          disabled={userAlreadyCreated}
          required
        >
          {allowedRoles.map((role) => (
            <option key={role} value={role}>
              {ROLE_LABELS[role]}
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
