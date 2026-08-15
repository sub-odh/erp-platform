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
  "EMPLOYEE",
];

export function getAssignableRoles(
  currentRole: UserRole | undefined,
): Array<Exclude<UserRole, "OWNER">> {
  if (currentRole === "OWNER") {
    return ASSIGNABLE_ROLES;
  }

  if (currentRole === "SUPER_ADMIN") {
    return ASSIGNABLE_ROLES.filter((role) => role !== "SUPER_ADMIN");
  }

  if (currentRole === "ADMIN") {
    return ASSIGNABLE_ROLES.filter(
      (role) => role !== "SUPER_ADMIN" && role !== "ADMIN",
    );
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

  if (currentRole === "OWNER") {
    return true;
  }

  if (currentRole === "SUPER_ADMIN") {
    return targetRole !== "SUPER_ADMIN";
  }

  if (currentRole === "ADMIN") {
    return targetRole !== "SUPER_ADMIN" && targetRole !== "ADMIN";
  }

  return currentRole === "HR" && targetRole === "EMPLOYEE";
}
