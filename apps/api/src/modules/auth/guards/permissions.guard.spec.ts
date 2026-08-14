import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { PERMISSIONS } from '../permissions/permission.constants';
import { PermissionsService } from '../permissions/permissions.service';
import { PermissionsGuard } from './permissions.guard';

function createContext(
  user?: {
    organizationId: string;
    role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'STAFF';
  },
): ExecutionContext {
  return {
    getClass: () => class TestController {},
    getHandler: () => function testHandler() {},
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

describe('PermissionsGuard', () => {
  const reflector = {
    getAllAndMerge: jest.fn(),
  } as unknown as Reflector;
  const permissionsService = {
    hasAll: jest.fn(),
  } as unknown as PermissionsService;
  const guard = new PermissionsGuard(reflector, permissionsService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows routes without permission metadata', async () => {
    jest.mocked(reflector.getAllAndMerge).mockReturnValue(undefined);

    await expect(guard.canActivate(createContext())).resolves.toBe(true);
    expect(permissionsService.hasAll).not.toHaveBeenCalled();
  });

  it('denies unauthenticated requests to permission-protected routes', async () => {
    jest
      .mocked(reflector.getAllAndMerge)
      .mockReturnValue([PERMISSIONS.USERS_MANAGE]);

    await expect(guard.canActivate(createContext())).resolves.toBe(false);
    expect(permissionsService.hasAll).not.toHaveBeenCalled();
  });

  it('checks all merged permissions for the authenticated tenant and role', async () => {
    const required = [
      PERMISSIONS.CRM_ACCESS,
      PERMISSIONS.CRM_PERMANENT_DELETE,
    ];
    jest.mocked(reflector.getAllAndMerge).mockReturnValue(required);
    jest.mocked(permissionsService.hasAll).mockResolvedValue(true);

    await expect(
      guard.canActivate(
        createContext({ organizationId: 'tenant-a', role: 'ADMIN' }),
      ),
    ).resolves.toBe(true);

    expect(permissionsService.hasAll).toHaveBeenCalledWith(
      'tenant-a',
      'ADMIN',
      required,
    );
  });
});
