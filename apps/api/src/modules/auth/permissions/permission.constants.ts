export const PERMISSIONS = {
  USERS_MANAGE: 'platform.users.manage',
  ORGANIZATION_MANAGE: 'platform.organization.manage',
  AUDIT_READ: 'platform.audit.read',
  NOTIFICATIONS_MANAGE: 'platform.notifications.manage',
  CRM_ACCESS: 'sales.crm.access',
  CRM_PERMANENT_DELETE: 'sales.crm.permanent-delete',
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const DEFAULT_ROLE_PERMISSIONS = {
  OWNER: Object.values(PERMISSIONS),
  ADMIN: Object.values(PERMISSIONS),
  MANAGER: [PERMISSIONS.CRM_ACCESS],
  STAFF: [PERMISSIONS.CRM_ACCESS],
} as const;
