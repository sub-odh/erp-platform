import { apiRequest } from "@/lib/api";
import type { User } from "@/types/user";

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  phone: string | null;
  dateOfBirth: string | null;
  fatherName: string | null;
  motherName: string | null;
  citizenshipNumber: string | null;
  panNumber: string | null;
  permanentAddress: string | null;
}

export function getProfile(): Promise<User> {
  return apiRequest<User>("/profile");
}

export function updateProfile(payload: UpdateProfileRequest): Promise<User> {
  return apiRequest<User>("/profile", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function uploadProfileAvatar(file: File): Promise<User> {
  const formData = new FormData();

  formData.append("file", file);

  return apiRequest<User>("/profile/avatar", {
    method: "POST",
    body: formData,
  });
}

export function removeProfileAvatar(): Promise<User> {
  return apiRequest<User>("/profile/avatar", {
    method: "DELETE",
  });
}

export function uploadProfileSignature(file: File): Promise<User> {
  const formData = new FormData();

  formData.append("file", file);

  return apiRequest<User>("/profile/signature", {
    method: "POST",
    body: formData,
  });
}

export function removeProfileSignature(): Promise<User> {
  return apiRequest<User>("/profile/signature", {
    method: "DELETE",
  });
}

export function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  return apiRequest<void>("/auth/change-password", {
    method: "POST",
    body: JSON.stringify({
      currentPassword,
      newPassword,
    }),
  });
}
