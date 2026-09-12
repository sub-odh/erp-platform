import { getStoredUser } from "@/lib/auth";
import type { UserRole } from "@/types/auth";

const ADMIN_ROLES: UserRole[] = ["OWNER", "SUPER_ADMIN", "ADMIN"];

function hasRole(role: UserRole | null | undefined, extra: UserRole[]) {
  if (!role) {
    return false;
  }

  return ADMIN_ROLES.includes(role) || extra.includes(role);
}

export function currentUserRole(): UserRole | null {
  return getStoredUser()?.role ?? null;
}

export function canManageMemos(role?: UserRole | null) {
  return hasRole(role ?? currentUserRole(), ["HR", "HEAD"]);
}

export function canManageHalls(role?: UserRole | null) {
  return hasRole(role ?? currentUserRole(), ["HR", "OPERATIONS"]);
}

export function canManagePartners(role?: UserRole | null) {
  return hasRole(role ?? currentUserRole(), ["HR"]);
}

export function canManageVisits(role?: UserRole | null) {
  return hasRole(role ?? currentUserRole(), ["HR", "OPERATIONS", "HEAD"]);
}
