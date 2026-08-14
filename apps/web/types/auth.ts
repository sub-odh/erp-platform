export type UserRole = "OWNER" | "ADMIN" | "MANAGER" | "STAFF";

export interface AuthUser {
  id: string;
  organizationId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatarUrl: string | null;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  user: AuthUser;
  license: LicenseSummary;
}

export interface LicenseSummary {
  status: "valid" | "warning" | "read_only" | "blocked";
  licensedModules: string[];
  validUntil: string;
  maxUsers: number;
  daysUntilExpiry: number;
}
