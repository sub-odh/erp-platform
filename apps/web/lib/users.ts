export {};
import { apiRequest } from "@/lib/api";
import type {
  CreateUserRequest,
  UpdateUserStatusRequest,
  User,
} from "@/types/user";

export function getUsers() {
  return apiRequest<User[]>("/users");
}

export function createUser(payload: CreateUserRequest) {
  return apiRequest<User>("/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateUserStatus(
  userId: string,
  payload: UpdateUserStatusRequest,
) {
  return apiRequest<User>(`/users/${userId}/status`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
