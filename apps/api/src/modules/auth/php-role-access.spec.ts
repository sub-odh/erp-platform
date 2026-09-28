import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { PERMISSIONS_KEY } from './decorators/permissions.decorator';
import { PermissionsGuard } from './guards/permissions.guard';
import { PERMISSIONS } from './permissions/permission.constants';
import { PermissionsService } from './permissions/permissions.service';
import { decideApi, decidePage, MENU_ROLE_ADMIN } from './php-role-access';

function createContext(input: {
  role: string;
  method: string;
  url: string;
}): ExecutionContext {
  return {
    getClass: () => class TestController {},
    getHandler: () => function testHandler() {},
    switchToHttp: () => ({
      getRequest: () => ({
        user: { organizationId: 'tenant-a', role: input.role },
        method: input.method,
        originalUrl: input.url,
      }),
    }),
  } as unknown as ExecutionContext;
}

describe('PHP role access', () => {
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
    jest.mocked(reflector.getAllAndMerge).mockImplementation((key) =>
      key === PERMISSIONS_KEY ? [PERMISSIONS.INVENTORY_ACCESS] : [],
    );
  });

  it('keeps role 1 as OWNER, SUPER_ADMIN and ADMIN', () => {
    expect(MENU_ROLE_ADMIN).toEqual(['OWNER', 'SUPER_ADMIN', 'ADMIN']);
  });

  it('lets Sales open tenders without the inventory permission', async () => {
    await expect(
      guard.canActivate(
        createContext({
          role: 'SALES',
          method: 'GET',
          url: '/api/v1/procurement/tenders',
        }),
      ),
    ).resolves.toBe(true);

    expect(permissionsService.hasAll).not.toHaveBeenCalled();
  });

  it('refuses Employee and HR on the routes PHP refuses', async () => {
    await expect(
      guard.canActivate(
        createContext({
          role: 'EMPLOYEE',
          method: 'GET',
          url: '/api/v1/procurement/tenders',
        }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    await expect(
      guard.canActivate(
        createContext({
          role: 'ADMIN',
          method: 'GET',
          url: '/api/v1/users',
        }),
      ),
    ).resolves.toBe(true);

    await expect(
      guard.canActivate(
        createContext({
          role: 'HR',
          method: 'PATCH',
          url: '/api/v1/procurement/tenders/1',
        }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(decidePage('/users', 'EMPLOYEE').allowed).toBe(false);
    expect(decidePage('/users', 'EMPLOYEE').redirect).toBe('/dashboard');
    expect(decideApi('GET', '/api/v1/audit-logs', 'SALES').allowed).toBe(true);
    expect(decideApi('GET', '/api/v1/audit-logs', 'EMPLOYEE').allowed).toBe(
      false,
    );
  });
});
