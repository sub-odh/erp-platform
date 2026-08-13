"use client";

import { KeyRound, Mail, ShieldCheck, UserRound } from "lucide-react";

import { useRouter } from "next/navigation";

import { type FormEvent, useCallback, useEffect, useState } from "react";

import { ImageUploader } from "@/components/media/image-uploader";
import { PasswordRequirements } from "@/components/security/password-requirements";
import { Button, Input } from "@/components/ui";

import { clearAuthSession, updateStoredUser } from "@/lib/auth";

import { resolveMediaUrl } from "@/lib/media";

import {
  isStrongPassword,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_POLICY_MESSAGE,
} from "@/lib/password-policy";

import {
  changePassword,
  getProfile,
  removeProfileAvatar,
  updateProfile,
  uploadProfileAvatar,
} from "@/lib/profile";

import type { User } from "@/types/user";

export default function ProfilePage() {
  const router = useRouter();

  const [profile, setProfile] = useState<User | null>(null);

  const [firstName, setFirstName] = useState("");

  const [lastName, setLastName] = useState("");

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [removingAvatar, setRemovingAvatar] = useState(false);

  const [profileError, setProfileError] = useState<string | null>(null);

  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");

  const [newPassword, setNewPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");

  const [changingPassword, setChangingPassword] = useState(false);

  const [passwordError, setPasswordError] = useState<string | null>(null);

  const syncProfile = useCallback((updated: User): void => {
    setProfile(updated);

    setFirstName(updated.firstName);

    setLastName(updated.lastName);

    updateStoredUser({
      firstName: updated.firstName,

      lastName: updated.lastName,

      email: updated.email,

      role: updated.role,

      avatarUrl: updated.avatarUrl,
    });
  }, []);

  useEffect(() => {
    async function loadProfile(): Promise<void> {
      setLoading(true);

      setProfileError(null);

      try {
        const result = await getProfile();

        syncProfile(result);
      } catch (requestError) {
        setProfileError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load your profile.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadProfile();
  }, [syncProfile]);

  async function handleProfileSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    const normalizedFirstName = firstName.trim();

    const normalizedLastName = lastName.trim();

    if (!normalizedFirstName || !normalizedLastName) {
      setProfileError("First name and last name are required.");

      return;
    }

    setSaving(true);

    setProfileError(null);

    setProfileSuccess(null);

    try {
      const updated = await updateProfile({
        firstName: normalizedFirstName,

        lastName: normalizedLastName,
      });

      syncProfile(updated);

      setProfileSuccess("Profile updated successfully.");
    } catch (requestError) {
      setProfileError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update your profile.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarUpload(file: File): Promise<void> {
    setUploadingAvatar(true);

    setProfileError(null);

    setProfileSuccess(null);

    try {
      const updated = await uploadProfileAvatar(file);

      syncProfile(updated);

      setProfileSuccess("Profile picture updated.");
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Unable to upload profile picture.";

      setProfileError(message);

      throw requestError;
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleAvatarRemove(): Promise<void> {
    setRemovingAvatar(true);

    setProfileError(null);

    setProfileSuccess(null);

    try {
      const updated = await removeProfileAvatar();

      syncProfile(updated);

      setProfileSuccess("Profile picture removed.");
    } catch (requestError) {
      setProfileError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to remove profile picture.",
      );

      throw requestError;
    } finally {
      setRemovingAvatar(false);
    }
  }

  async function handlePasswordSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    setPasswordError(null);

    if (!currentPassword) {
      setPasswordError("Current password is required.");

      return;
    }

    if (!isStrongPassword(newPassword)) {
      setPasswordError(PASSWORD_POLICY_MESSAGE);

      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");

      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError(
        "New password must be different from your current password.",
      );

      return;
    }

    setChangingPassword(true);

    try {
      await changePassword(currentPassword, newPassword);

      /*
       * Changing the password revokes
       * the user's existing sessions.
       */
      clearAuthSession();

      router.replace("/login?passwordChanged=1");
    } catch (requestError) {
      setPasswordError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to change password.",
      );

      setChangingPassword(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 rounded bg-slate-200" />

          <div className="h-64 rounded-2xl bg-slate-100" />

          <div className="h-72 rounded-2xl bg-slate-100" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          My profile
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Manage your personal information, profile picture, and password.
        </p>
      </div>

      {profileError && !profile ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {profileError}
        </div>
      ) : null}

      {profile ? (
        <>
          <section className="overflow-visible rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <UserRound size={20} />
                </div>

                <div>
                  <h2 className="font-semibold text-slate-900">
                    Personal information
                  </h2>

                  <p className="text-sm text-slate-500">
                    Your photo and basic account information.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid gap-8 lg:grid-cols-[200px_1fr]">
                <div className="flex justify-center lg:justify-start">
                  <ImageUploader
                    preset="avatar"
                    value={resolveMediaUrl(profile.avatarUrl)}
                    disabled={saving}
                    uploading={uploadingAvatar}
                    removing={removingAvatar}
                    onUpload={handleAvatarUpload}
                    onRemove={handleAvatarRemove}
                  />
                </div>

                <form onSubmit={handleProfileSubmit} className="space-y-5">
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
                    value={profile.email}
                    leadingIcon={<Mail size={17} />}
                    disabled
                    hint="Contact an administrator if your email address needs to be changed."
                  />

                  <div>
                    <p className="mb-2 text-sm font-medium text-slate-700">
                      Role
                    </p>

                    <div className="flex h-11 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600">
                      <ShieldCheck size={17} className="text-slate-400" />

                      {profile.role}
                    </div>
                  </div>

                  {profileError ? (
                    <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                      {profileError}
                    </div>
                  ) : null}

                  {profileSuccess ? (
                    <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                      {profileSuccess}
                    </div>
                  ) : null}

                  <div className="flex justify-end border-t border-slate-100 pt-5">
                    <Button
                      type="submit"
                      loading={saving}
                      disabled={uploadingAvatar || removingAvatar}
                    >
                      Save changes
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                  <KeyRound size={20} />
                </div>

                <div>
                  <h2 className="font-semibold text-slate-900">Password</h2>

                  <p className="text-sm text-slate-500">
                    Change your account password.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-5 p-6">
              <div className="max-w-xl space-y-5">
                <Input
                  label="Current password"
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  maxLength={PASSWORD_MAX_LENGTH}
                  required
                />

                <div className="space-y-3">
                  <Input
                    label="New password"
                    type="password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    minLength={PASSWORD_MIN_LENGTH}
                    maxLength={PASSWORD_MAX_LENGTH}
                    required
                  />

                  <PasswordRequirements password={newPassword} />
                </div>

                <Input
                  label="Confirm new password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  minLength={PASSWORD_MIN_LENGTH}
                  maxLength={PASSWORD_MAX_LENGTH}
                  required
                />

                {passwordError ? (
                  <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                    {passwordError}
                  </div>
                ) : null}
              </div>

              <div className="flex justify-end border-t border-slate-100 pt-5">
                <Button
                  type="submit"
                  variant="secondary"
                  loading={changingPassword}
                >
                  Change password
                </Button>
              </div>
            </form>
          </section>
        </>
      ) : null}
    </div>
  );
}
