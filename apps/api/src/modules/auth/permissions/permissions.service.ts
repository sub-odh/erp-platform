import { Injectable } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';

import {
  db,
  permissions,
  rolePermissions,
  withTenantContext,
  type User,
} from '@erp/db';

import type { PermissionCode } from './permission.constants';

@Injectable()
export class PermissionsService {
  async hasAll(
    organizationId: string,
    role: User['role'],
    requiredPermissions: PermissionCode[],
  ): Promise<boolean> {
    if (requiredPermissions.length === 0) {
      return true;
    }

    const uniquePermissions = [...new Set(requiredPermissions)];

    return withTenantContext(organizationId, async () => {
      const granted = await db
        .select({ code: permissions.code })
        .from(rolePermissions)
        .innerJoin(
          permissions,
          eq(rolePermissions.permissionId, permissions.id),
        )
        .where(
          and(
            eq(rolePermissions.organizationId, organizationId),
            eq(rolePermissions.role, role),
            inArray(permissions.code, uniquePermissions),
          ),
        );

      const grantedCodes = new Set(granted.map(({ code }) => code));

      return uniquePermissions.every((permission) =>
        grantedCodes.has(permission),
      );
    });
  }
}
