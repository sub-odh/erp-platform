export type UserRole = "OWNER" | "ADMIN" | "MANAGER" | "STAFF";

export type UserListStatus = "active" | "inactive" | "archived" | "all";

export type UserSortField =
  | "firstName"
  | "email"
  | "role"
  | "lastLoginAt"
  | "createdAt";

export type UserSortDirection = "asc" | "desc";

export interface User {
  id: string;
  organizationId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: Exclude<UserRole, "OWNER">;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  role?: Exclude<UserRole, "OWNER">;
}

export interface UpdateUserStatusRequest {
  isActive: boolean;
}

export interface ResetUserPasswordResponse {
  userId: string;
  temporaryPassword: string;
  mustChangePassword: boolean;
}

export interface UserListQuery {
  search?: string;
  status?: UserListStatus;
  role?: UserRole;
  page?: number;
  limit?: number;
  sortBy?: UserSortField;
  sortDirection?: UserSortDirection;
}

export interface UserListCounts {
  active: number;
  inactive: number;
  archived: number;
  total: number;
}

export interface UserListPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedUsersResponse {
  data: User[];
  pagination: UserListPagination;
  counts: UserListCounts;
}
