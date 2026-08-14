import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { lastValueFrom, of, throwError } from 'rxjs';

import { AuditInterceptor } from './audit.interceptor';
import { AuditService } from './audit.service';

const ENTITY_ID = '11111111-1111-4111-8111-111111111111';

function createContext(method: string, authenticated = true): ExecutionContext {
  const request = {
    method,
    baseUrl: '/api/v1/sales/leads',
    path: `/${ENTITY_ID}`,
    route: { path: '/:leadId' },
    params: { leadId: ENTITY_ID },
    ip: '127.0.0.1',
    id: 'request-1',
    get: (header: string) =>
      header === 'user-agent' ? 'audit-test-agent' : undefined,
    user: authenticated
      ? {
          sub: '22222222-2222-4222-8222-222222222222',
          organizationId: '33333333-3333-4333-8333-333333333333',
          role: 'ADMIN',
        }
      : undefined,
  };

  return {
    getClass: () => class LeadsController {},
    getHandler: () => function updateLead() {},
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => ({ statusCode: 200 }),
    }),
  } as unknown as ExecutionContext;
}

describe('AuditInterceptor', () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  } as unknown as Reflector;
  const auditService = {
    record: jest.fn().mockResolvedValue(undefined),
  } as unknown as AuditService;
  const interceptor = new AuditInterceptor(reflector, auditService);

  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .mocked(reflector.getAllAndOverride)
      .mockReturnValue('sales.lead');
    jest.mocked(auditService.record).mockResolvedValue(undefined);
  });

  it('records a successful authenticated mutation', async () => {
    const result = { id: ENTITY_ID, status: 'QUALIFIED' };
    const next: CallHandler = { handle: () => of(result) };

    await expect(
      lastValueFrom(interceptor.intercept(createContext('PATCH'), next)),
    ).resolves.toBe(result);

    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'PATCH /api/v1/sales/leads/:leadId',
        entityType: 'sales.lead',
        entityId: ENTITY_ID,
        requestMethod: 'PATCH',
        requestPath: '/api/v1/sales/leads/:leadId',
      }),
    );
  });

  it('does not audit safe reads', async () => {
    const next: CallHandler = { handle: () => of({ id: ENTITY_ID }) };

    await lastValueFrom(interceptor.intercept(createContext('GET'), next));

    expect(auditService.record).not.toHaveBeenCalled();
  });

  it('does not audit a failed mutation', async () => {
    const next: CallHandler = {
      handle: () => throwError(() => new Error('mutation failed')),
    };

    await expect(
      lastValueFrom(interceptor.intercept(createContext('DELETE'), next)),
    ).rejects.toThrow('mutation failed');

    expect(auditService.record).not.toHaveBeenCalled();
  });
});
