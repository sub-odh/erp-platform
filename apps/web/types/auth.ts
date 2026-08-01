export type UserRole = "OWNER" | "ADMIN" | "MANAGER" | "STAFF";

export interface AuthUser {
  id: string;
  organizationId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  refreshExpiresIn: number;
  user: AuthUser;
}
