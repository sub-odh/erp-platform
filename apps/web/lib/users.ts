import { apiRequest } from "@/lib/api";
import type {
  CreateUserRequest,
  PaginatedUsersResponse,
  ResetUserPasswordResponse,
  UpdateUserRequest,
  UpdateUserStatusRequest,
  User,
  UserListQuery,
} from "@/types/user";

function createQueryString(query: UserListQuery): string {
  const params = new URLSearchParams();

  if (query.search) {
    params.set("search", query.search);
  }

  if (query.status) {
    params.set("status", query.status);
  }

  if (query.role) {
    params.set("role", query.role);
  }

  if (query.page !== undefined) {
    params.set("page", String(query.page));
  }

  if (query.limit !== undefined) {
    params.set("limit", String(query.limit));
  }

  if (query.sortBy) {
    params.set("sortBy", query.sortBy);
  }

  if (query.sortDirection) {
    params.set("sortDirection", query.sortDirection);
  }

  const value = params.toString();

  return value ? `?${value}` : "";
}

export function getUsers(query: UserListQuery = {}) {
  return apiRequest<PaginatedUsersResponse>(
    `/users${createQueryString(query)}`,
  );
}

export function createUser(payload: CreateUserRequest) {
  return apiRequest<User>("/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateUser(userId: string, payload: UpdateUserRequest) {
  return apiRequest<User>(`/users/${userId}`, {
    method: "PATCH",
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

export function resetUserPassword(userId: string) {
  return apiRequest<ResetUserPasswordResponse>(
    `/users/${userId}/reset-password`,
    {
      method: "POST",
    },
  );
}

export function archiveUser(userId: string) {
  return apiRequest<void>(`/users/${userId}`, {
    method: "DELETE",
  });
}

export function restoreUser(userId: string) {
  return apiRequest<User>(`/users/${userId}/restore`, {
    method: "POST",
  });
}
