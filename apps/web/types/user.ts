export type UserRole =
  | "OWNER"
  | "SUPER_ADMIN"
  | "ADMIN"
  | "HR"
  | "OPERATIONS"
  | "EMPLOYEE"
  | "SALES"
  | "MANAGEMENT"
  | "HEAD"
  | "MANAGER"
  | "STAFF";

export type UserListStatus = "active" | "inactive" | "archived" | "all";

export type UserSortField =
  "firstName" | "email" | "role" | "lastLoginAt" | "createdAt";

export type UserSortDirection = "asc" | "desc";

export interface User {
  id: string;
  organizationId: string;
  employeeId: string | null;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  dateOfBirth: string | null;
  fatherName: string | null;
  motherName: string | null;
  citizenshipNumber: string | null;
  panNumber: string | null;
  permanentAddress: string | null;
  role: UserRole;
  isActive: boolean;
  lastLoginAt: string | null;

  avatarUrl: string | null;
  avatarFileName: string | null;
  avatarMimeType: string | null;
  avatarSize: number | null;

  signatureUrl: string | null;
  signatureFileName: string | null;
  signatureMimeType: string | null;
  signatureSize: number | null;

  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateUserRequest {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: Exclude<UserRole, "OWNER">;
}

export interface UpdateUserRequest {
  employeeId?: string;
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
