"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";

import { ImageUploader } from "@/components/media/image-uploader";
import { Button, Input, Modal, Select } from "@/components/ui";
import { getStoredUser, updateStoredUser } from "@/lib/auth";
import {
  getEmployeeRoles,
  removeUserAvatar,
  updateUser,
  uploadUserAvatar,
} from "@/lib/users";
import { getAssignableRoles, ROLE_LABELS } from "@/lib/user-roles";
import type {
  EmployeeRole,
  UpdateUserRequest,
  User,
  UserRole,
} from "@/types/user";

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

  const [employeeId, setEmployeeId] = useState("");

  const [joinedDate, setJoinedDate] = useState("");

  const [employeeRole, setEmployeeRole] = useState("");

  const [employeeRoles, setEmployeeRoles] = useState<EmployeeRole[]>([]);

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

    setEmployeeId(user.employeeId ?? "");

    setJoinedDate(user.joinedDate ?? user.createdAt.slice(0, 10));

    setEmployeeRole(user.employeeRole ?? "");

    if (user.role !== "OWNER") {
      setRole(user.role);
    }

    setError(null);
  }, [user]);

  useEffect(() => {
    if (!open) return;
    void getEmployeeRoles()
      .then(setEmployeeRoles)
      .catch(() => {});
  }, [open]);

  const allowedRoles = useMemo(
    () => getAssignableRoles(currentUser?.role),
    [currentUser?.role],
  );

  // Preserve a legacy access level while it is being updated. New accounts can
  // only be assigned the current access levels shown in `allowedRoles`.
  const selectableRoles = useMemo(
    () =>
      allowedRoles.includes(role) ? allowedRoles : [role, ...allowedRoles],
    [allowedRoles, role],
  );

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
      employeeId: employeeId.trim().toUpperCase(),

      firstName: normalizedFirstName,

      lastName: normalizedLastName,

      joinedDate,

      employeeRole,
      ...(role !== workingUser.role ? { role } : {}),
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
      description="Update the employee ID, profile, avatar, access level, and job title."
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
              value={workingUser.avatarUrl}
              disabled={submitting}
              uploading={uploadingAvatar}
              removing={removingAvatar}
              onUpload={handleAvatarUpload}
              onRemove={handleAvatarRemove}
            />
          </div>
        ) : null}

        <form id="edit-user-form" onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Employee ID"
            value={employeeId}
            onChange={(event) => setEmployeeId(event.target.value)}
            maxLength={50}
            required
          />

          <Input
            label="Joined Date"
            type="date"
            value={joinedDate}
            onChange={(event) => setJoinedDate(event.target.value)}
            required
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label="First Name"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              maxLength={100}
              required
            />

            <Input
              label="Last Name"
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
            label="Access Level"
            value={role}
            onChange={(event) =>
              setRole(event.target.value as Exclude<UserRole, "OWNER">)
            }
            required
          >
            {selectableRoles.map((option) => (
              <option key={option} value={option}>
                {ROLE_LABELS[option]}
              </option>
            ))}
          </Select>

          <Select
            label="Employee Role"
            value={employeeRole}
            onChange={(event) => setEmployeeRole(event.target.value)}
            required
          >
            <option value="" disabled>
              Select employee role
            </option>
            {employeeRoles.map((option) => (
              <option key={option.id} value={option.name}>
                {option.name}
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
