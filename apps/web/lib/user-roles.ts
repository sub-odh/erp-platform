import type { UserRole } from "@/types/user";

export const ROLE_LABELS: Record<UserRole, string> = {
  OWNER: "Owner",
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  HR: "HR",
  OPERATIONS: "Operations",
  EMPLOYEE: "Employee",
  SALES: "Sales",
  MANAGEMENT: "Management",
  HEAD: "Head",
  MANAGER: "Manager",
  STAFF: "Staff",
};

const ASSIGNABLE_ROLES: Array<Exclude<UserRole, "OWNER">> = [
  "SUPER_ADMIN",
  "ADMIN",
  "HR",
  "OPERATIONS",
  "EMPLOYEE",
  "SALES",
  "MANAGEMENT",
  "HEAD",
];

export function getAssignableRoles(
  currentRole: UserRole | undefined,
): Array<Exclude<UserRole, "OWNER">> {
  if (
    currentRole === "OWNER" ||
    currentRole === "SUPER_ADMIN" ||
    currentRole === "ADMIN"
  ) {
    return ASSIGNABLE_ROLES;
  }

  if (currentRole === "HR") {
    return ["EMPLOYEE"];
  }

  return [];
}

export function canManageUserRole(
  currentRole: UserRole | undefined,
  targetRole: UserRole,
): boolean {
  if (targetRole === "OWNER") {
    return false;
  }

  if (
    currentRole === "OWNER" ||
    currentRole === "SUPER_ADMIN" ||
    currentRole === "ADMIN"
  ) {
    return true;
  }

  return currentRole === "HR" && targetRole === "EMPLOYEE";
}
