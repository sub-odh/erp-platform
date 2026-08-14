import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { lastValueFrom, of } from 'rxjs';

import { withTenantContext } from '@erp/db';

import { TenantContextInterceptor } from './tenant-context.interceptor';

jest.mock('@erp/db', () => ({
  withTenantContext: jest.fn(
    async (_tenantId: string, callback: () => Promise<unknown>) => callback(),
  ),
}));

const mockedWithTenantContext = jest.mocked(withTenantContext);

function createExecutionContext(user?: { organizationId: string }) {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

describe('TenantContextInterceptor', () => {
  beforeEach(() => {
    mockedWithTenantContext.mockClear();
  });

  it('runs authenticated handlers inside their tenant context', async () => {
    const interceptor = new TenantContextInterceptor();
    const next: CallHandler = {
      handle: () => of({ ok: true }),
    };

    await expect(
      lastValueFrom(
        interceptor.intercept(
          createExecutionContext({ organizationId: 'tenant-a' }),
          next,
        ),
      ),
    ).resolves.toEqual({ ok: true });

    expect(mockedWithTenantContext).toHaveBeenCalledWith(
      'tenant-a',
      expect.any(Function),
    );
  });

  it('does not create a tenant transaction for public handlers', async () => {
    const interceptor = new TenantContextInterceptor();
    const next: CallHandler = {
      handle: () => of({ public: true }),
    };

    await expect(
      lastValueFrom(interceptor.intercept(createExecutionContext(), next)),
    ).resolves.toEqual({ public: true });

    expect(mockedWithTenantContext).not.toHaveBeenCalled();
  });
});
