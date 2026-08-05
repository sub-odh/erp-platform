export type UserRole = "OWNER" | "ADMIN" | "MANAGER" | "STAFF";

export interface User {
  id: string;
  organizationId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: Exclude<UserRole, "OWNER">;
}

export interface UpdateUserStatusRequest {
  isActive: boolean;
}
