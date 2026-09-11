import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import {
  PERMISSIONS_ANY_KEY,
  PERMISSIONS_KEY,
} from '../decorators/permissions.decorator';
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
    hasAny: jest.fn(),
  } as unknown as PermissionsService;
  const guard = new PermissionsGuard(reflector, permissionsService);

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(reflector.getAllAndMerge).mockImplementation(() => []);
  });

  it('allows routes without permission metadata', async () => {
    await expect(guard.canActivate(createContext())).resolves.toBe(true);
    expect(permissionsService.hasAll).not.toHaveBeenCalled();
    expect(permissionsService.hasAny).not.toHaveBeenCalled();
  });

  it('denies unauthenticated requests to permission-protected routes', async () => {
    jest.mocked(reflector.getAllAndMerge).mockImplementation((key) =>
      key === PERMISSIONS_KEY ? [PERMISSIONS.USERS_MANAGE] : [],
    );

    await expect(guard.canActivate(createContext())).resolves.toBe(false);
    expect(permissionsService.hasAll).not.toHaveBeenCalled();
  });

  it('checks all merged permissions for the authenticated tenant and role', async () => {
    const required = [
      PERMISSIONS.CRM_ACCESS,
      PERMISSIONS.CRM_PERMANENT_DELETE,
    ];
    jest.mocked(reflector.getAllAndMerge).mockImplementation((key) =>
      key === PERMISSIONS_KEY ? required : [],
    );
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
    expect(permissionsService.hasAny).not.toHaveBeenCalled();
  });

  it('allows a route when any listed permission is granted', async () => {
    const anyRequired = [PERMISSIONS.CRM_ACCESS, PERMISSIONS.INVENTORY_ACCESS];
    jest.mocked(reflector.getAllAndMerge).mockImplementation((key) =>
      key === PERMISSIONS_ANY_KEY ? anyRequired : [],
    );
    jest.mocked(permissionsService.hasAny).mockResolvedValue(true);

    await expect(
      guard.canActivate(
        createContext({ organizationId: 'tenant-a', role: 'STAFF' }),
      ),
    ).resolves.toBe(true);

    expect(permissionsService.hasAny).toHaveBeenCalledWith(
      'tenant-a',
      'STAFF',
      anyRequired,
    );
  });
});
