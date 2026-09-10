"use client";

import {
  BadgeCheck,
  BriefcaseBusiness,
  FileSignature,
  Info,
  KeyRound,
} from "lucide-react";
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
  removeProfileSignature,
  updateProfile,
  uploadProfileAvatar,
  uploadProfileSignature,
} from "@/lib/profile";
import { ROLE_LABELS } from "@/lib/user-roles";
import type { User } from "@/types/user";

interface ProfileFormState {
  firstName: string;
  lastName: string;
  phone: string;
  dateOfBirth: string;
  fatherName: string;
  motherName: string;
  citizenshipNumber: string;
  panNumber: string;
  permanentAddress: string;
}

const EMPTY_PROFILE_FORM: ProfileFormState = {
  firstName: "",
  lastName: "",
  phone: "",
  dateOfBirth: "",
  fatherName: "",
  motherName: "",
  citizenshipNumber: "",
  panNumber: "",
  permanentAddress: "",
};

function createProfileForm(profile: User): ProfileFormState {
  return {
    firstName: profile.firstName,
    lastName: profile.lastName,
    phone: profile.phone ?? "",
    dateOfBirth: profile.dateOfBirth ?? "",
    fatherName: profile.fatherName ?? "",
    motherName: profile.motherName ?? "",
    citizenshipNumber: profile.citizenshipNumber ?? "",
    panNumber: profile.panNumber ?? "",
    permanentAddress: profile.permanentAddress ?? "",
  };
}

function nullableValue(value: string): string | null {
  return value.trim() || null;
}

function SectionHeading({
  title,
  icon,
}: {
  title: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-blue-600">
        {icon}
        <span>{title}</span>
      </div>
      <div className="h-px flex-1 bg-slate-200" />
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<User | null>(null);
  const [form, setForm] = useState<ProfileFormState>(EMPTY_PROFILE_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [removingAvatar, setRemovingAvatar] = useState(false);
  const [uploadingSignature, setUploadingSignature] = useState(false);
  const [removingSignature, setRemovingSignature] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const applyProfile = useCallback(
    (updated: User, resetForm: boolean): void => {
      setProfile(updated);

      if (resetForm) {
        setForm(createProfileForm(updated));
      }

      updateStoredUser({
        firstName: updated.firstName,
        lastName: updated.lastName,
        email: updated.email,
        role: updated.role,
        avatarUrl: updated.avatarUrl,
      });
    },
    [],
  );

  useEffect(() => {
    async function loadProfile(): Promise<void> {
      setLoading(true);
      setProfileError(null);

      try {
        applyProfile(await getProfile(), true);
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
  }, [applyProfile]);

  function updateField(field: keyof ProfileFormState, value: string): void {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleProfileSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (!form.firstName.trim() || !form.lastName.trim()) {
      setProfileError("First name and last name are required.");
      return;
    }

    setSaving(true);
    setProfileError(null);
    setProfileSuccess(null);

    try {
      const updated = await updateProfile({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: nullableValue(form.phone),
        dateOfBirth: nullableValue(form.dateOfBirth),
        fatherName: nullableValue(form.fatherName),
        motherName: nullableValue(form.motherName),
        citizenshipNumber: nullableValue(form.citizenshipNumber),
        panNumber: nullableValue(form.panNumber),
        permanentAddress: nullableValue(form.permanentAddress),
      });

      applyProfile(updated, true);
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
      applyProfile(await uploadProfileAvatar(file), false);
      setProfileSuccess("Profile picture updated.");
    } catch (requestError) {
      setProfileError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to upload profile picture.",
      );
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
      applyProfile(await removeProfileAvatar(), false);
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

  async function handleSignatureUpload(file: File): Promise<void> {
    setUploadingSignature(true);
    setProfileError(null);
    setProfileSuccess(null);

    try {
      applyProfile(await uploadProfileSignature(file), false);
      setProfileSuccess("Digital signature updated.");
    } catch (requestError) {
      setProfileError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to upload digital signature.",
      );
      throw requestError;
    } finally {
      setUploadingSignature(false);
    }
  }

  async function handleSignatureRemove(): Promise<void> {
    setRemovingSignature(true);
    setProfileError(null);
    setProfileSuccess(null);

    try {
      applyProfile(await removeProfileSignature(), false);
      setProfileSuccess("Digital signature removed.");
    } catch (requestError) {
      setProfileError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to remove digital signature.",
      );
      throw requestError;
    } finally {
      setRemovingSignature(false);
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
      <div className="mx-auto max-w-7xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-64 rounded bg-slate-200" />
          <div className="h-225 rounded-2xl bg-slate-100" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          My Personal Profile
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your account identity and security settings.
        </p>
      </div>

      {profileError && !profile ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {profileError}
        </div>
      ) : null}

      {profile ? (
        <section className="overflow-visible rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid items-center gap-8 border-b border-slate-100 px-6 py-8 sm:px-10 lg:grid-cols-[176px_1fr]">
            <div className="flex justify-center lg:justify-start">
              <ImageUploader
                preset="profileAvatar"
                value={resolveMediaUrl(profile.avatarUrl)}
                emptyLabel="Add photo"
                disabled={saving}
                uploading={uploadingAvatar}
                removing={removingAvatar}
                onUpload={handleAvatarUpload}
                onRemove={handleAvatarRemove}
              />
            </div>

            <div className="text-center lg:text-left">
              <h2 className="text-2xl font-semibold text-slate-900">
                {profile.firstName} {profile.lastName}
              </h2>
              <div className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-slate-500 lg:justify-start">
                <span className="inline-flex items-center gap-2">
                  <BadgeCheck size={17} className="text-blue-600" />
                  {profile.employeeId ?? "Employee ID not assigned"}
                </span>
                <span className="inline-flex items-center gap-2">
                  <BriefcaseBusiness size={17} className="text-blue-600" />
                  {ROLE_LABELS[profile.role]}
                </span>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleProfileSubmit}
            className="space-y-9 px-6 py-8 sm:px-10"
          >
            <div className="space-y-5">
              <SectionHeading
                title="Personal Details"
                icon={<BadgeCheck size={15} />}
              />
              <div className="grid gap-5 md:grid-cols-3">
                <Input
                  label="First Name"
                  value={form.firstName}
                  onChange={(event) =>
                    updateField("firstName", event.target.value)
                  }
                  maxLength={100}
                  required
                />
                <Input
                  label="Last Name"
                  value={form.lastName}
                  onChange={(event) =>
                    updateField("lastName", event.target.value)
                  }
                  maxLength={100}
                  required
                />
                <Input
                  label="Phone Contact"
                  type="tel"
                  value={form.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                  maxLength={50}
                />
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <Input
                  label="Official Email"
                  type="email"
                  value={profile.email}
                  disabled
                  hint="Contact an administrator to change your login email."
                />
                <Input
                  label="Date of Birth"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(event) =>
                    updateField("dateOfBirth", event.target.value)
                  }
                />
              </div>
            </div>

            <div className="space-y-5">
              <SectionHeading
                title="Identity & Address"
                icon={<BadgeCheck size={15} />}
              />
              <div className="grid gap-5 md:grid-cols-3">
                <Input
                  label="Father's Name"
                  value={form.fatherName}
                  onChange={(event) =>
                    updateField("fatherName", event.target.value)
                  }
                  maxLength={200}
                />
                <Input
                  label="Mother's Name"
                  value={form.motherName}
                  onChange={(event) =>
                    updateField("motherName", event.target.value)
                  }
                  maxLength={200}
                />
                <Input
                  label="Citizenship No."
                  value={form.citizenshipNumber}
                  onChange={(event) =>
                    updateField("citizenshipNumber", event.target.value)
                  }
                  maxLength={100}
                />
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <Input
                  label="PAN number"
                  value={form.panNumber}
                  onChange={(event) =>
                    updateField("panNumber", event.target.value)
                  }
                  maxLength={100}
                />
                <Input
                  label="Permanent Address"
                  value={form.permanentAddress}
                  onChange={(event) =>
                    updateField("permanentAddress", event.target.value)
                  }
                  maxLength={500}
                />
              </div>
            </div>

            <div className="space-y-5">
              <SectionHeading
                title="Digital Authorization Signature"
                icon={<FileSignature size={15} />}
              />
              <div className="grid items-start gap-8 lg:grid-cols-[1fr_320px]">
                <div className="space-y-3">
                  <p className="text-sm font-medium text-slate-700">
                    Upload official signature (.PNG only)
                  </p>
                  <div className="flex h-11 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                    <label
                      htmlFor="profile-signature-upload"
                      aria-disabled={
                        saving || uploadingSignature || removingSignature
                      }
                      className={[
                        "flex cursor-pointer items-center border-r border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100",
                        saving || uploadingSignature || removingSignature
                          ? "pointer-events-none opacity-60"
                          : "",
                      ].join(" ")}
                    >
                      Choose PNG file
                    </label>
                    <span className="flex min-w-0 flex-1 items-center truncate px-4 text-sm text-slate-500">
                      {profile.signatureUrl
                        ? "Official signature uploaded"
                        : "No file chosen"}
                    </span>
                  </div>
                  <p className="text-sm leading-6 text-slate-500">
                    This signature may be used on authorized company documents.
                    Use a clear image with a transparent or white background.
                  </p>
                  <div className="flex items-start gap-2 text-xs text-blue-700">
                    <Info size={15} className="mt-0.5 shrink-0" />
                    <span>Normalized to 300 × 197 pixels before upload.</span>
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium text-slate-700">
                    Signature Reference Preview
                  </p>
                  <ImageUploader
                    preset="signature"
                    value={resolveMediaUrl(profile.signatureUrl)}
                    accept="image/png"
                    emptyLabel="Add signature"
                    previewAspectRatio
                    inputId="profile-signature-upload"
                    disabled={saving}
                    uploading={uploadingSignature}
                    removing={removingSignature}
                    onUpload={handleSignatureUpload}
                    onRemove={handleSignatureRemove}
                  />
                </div>
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

            <div className="flex justify-end border-t border-slate-100 pt-6">
              <Button
                type="submit"
                loading={saving}
                disabled={
                  uploadingAvatar ||
                  removingAvatar ||
                  uploadingSignature ||
                  removingSignature
                }
                className="w-full sm:w-auto sm:min-w-64"
              >
                Update My Profile
              </Button>
            </div>
          </form>

          <div className="border-t border-slate-100 px-6 py-8 sm:px-10">
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <SectionHeading
                title="Account Security"
                icon={<KeyRound size={15} />}
              />
              <div className="grid items-start gap-5 lg:grid-cols-3">
                <Input
                  label="Current Password"
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  maxLength={PASSWORD_MAX_LENGTH}
                  required
                />
                <div className="space-y-3">
                  <Input
                    label="New Password"
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
                  label="Confirm New Password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  minLength={PASSWORD_MIN_LENGTH}
                  maxLength={PASSWORD_MAX_LENGTH}
                  required
                />
              </div>

              {passwordError ? (
                <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                  {passwordError}
                </div>
              ) : null}

              <div className="flex justify-end">
                <Button
                  type="submit"
                  variant="secondary"
                  loading={changingPassword}
                  className="w-full sm:w-auto sm:min-w-64"
                >
                  Change Password
                </Button>
              </div>
            </form>
          </div>
        </section>
      ) : null}
    </div>
  );
}
