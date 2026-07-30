import { SetMetadata } from '@nestjs/common';

import type { User } from '@erp/db';

export type UserRole = User['role'];

export const ROLES_KEY = 'roles';

export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
