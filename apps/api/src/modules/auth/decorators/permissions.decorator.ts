import { SetMetadata } from '@nestjs/common';

import type { PermissionCode } from '../permissions/permission.constants';

export const PERMISSIONS_KEY = 'permissions';
export const PERMISSIONS_ANY_KEY = 'permissionsAny';

export const RequirePermissions = (...permissions: PermissionCode[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

export const RequireAnyPermissions = (...permissions: PermissionCode[]) =>
  SetMetadata(PERMISSIONS_ANY_KEY, permissions);
