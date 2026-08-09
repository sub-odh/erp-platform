"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";

import { ImageUploader } from "@/components/media/image-uploader";
import { Button, Input, Modal, Select } from "@/components/ui";
import { getStoredUser, updateStoredUser } from "@/lib/auth";
import { resolveMediaUrl } from "@/lib/media";
import { removeUserAvatar, updateUser, uploadUserAvatar } from "@/lib/users";
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

  const [workingUser, setWorkingUser] = useState<User | null>(null);

  const [firstName, setFirstName] = useState("");

  const [lastName, setLastName] = useState("");

  const [role, setRole] = useState<Exclude<UserRole, "OWNER">>("STAFF");

  const [error, setError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);

  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [removingAvatar, setRemovingAvatar] = useState(false);

  useEffect(() => {
    if (!user) {
      setWorkingUser(null);
      return;
    }

    setWorkingUser(user);

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

  const busy = submitting || uploadingAvatar || removingAvatar;

  function handleClose(): void {
    if (busy) {
      return;
    }

    setError(null);
    onClose();
  }

  function syncCurrentUser(updatedUser: User): void {
    if (currentUser?.id !== updatedUser.id) {
      return;
    }

    updateStoredUser({
      firstName: updatedUser.firstName,

      lastName: updatedUser.lastName,

      email: updatedUser.email,

      role: updatedUser.role,

      avatarUrl: updatedUser.avatarUrl,
    });
  }

  async function handleAvatarUpload(file: File): Promise<void> {
    if (!workingUser) {
      return;
    }

    setUploadingAvatar(true);
    setError(null);

    try {
      const updated = await uploadUserAvatar(workingUser.id, file);

      setWorkingUser(updated);

      syncCurrentUser(updated);

      onUpdated(updated);
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Unable to upload avatar.";

      setError(message);

      throw requestError;
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleAvatarRemove(): Promise<void> {
    if (!workingUser) {
      return;
    }

    setRemovingAvatar(true);
    setError(null);

    try {
      const updated = await removeUserAvatar(workingUser.id);

      setWorkingUser(updated);

      syncCurrentUser(updated);

      onUpdated(updated);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to remove avatar.",
      );
    } finally {
      setRemovingAvatar(false);
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (!workingUser) {
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
      const updated = await updateUser(workingUser.id, payload);

      setWorkingUser(updated);

      syncCurrentUser(updated);

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
      description="Update the user's profile, avatar, and role."
      onClose={handleClose}
      className="max-w-2xl"
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={busy}>
            Cancel
          </Button>

          <Button
            type="submit"
            form="edit-user-form"
            loading={submitting}
            disabled={uploadingAvatar || removingAvatar}
          >
            Save changes
          </Button>
        </>
      }
    >
      <div className="space-y-7">
        {workingUser ? (
          <div className="flex justify-center py-2">
            <ImageUploader
              preset="avatar"
              value={resolveMediaUrl(workingUser.avatarUrl)}
              disabled={submitting}
              uploading={uploadingAvatar}
              removing={removingAvatar}
              onUpload={handleAvatarUpload}
              onRemove={handleAvatarRemove}
            />
          </div>
        ) : null}

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
            value={workingUser?.email ?? ""}
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
      </div>
    </Modal>
  );
}
