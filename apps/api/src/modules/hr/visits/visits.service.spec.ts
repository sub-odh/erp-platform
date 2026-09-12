import { ConflictException, NotFoundException } from '@nestjs/common';

import { PermissionsService } from '../../auth/permissions/permissions.service';
import { CustomersFacade } from '../../sales/customers/customers.facade';
import { EmployeesService } from '../employees/employees.service';
import { VisitsRepository } from './visits.repository';
import { VisitsService } from './visits.service';

describe('VisitsService', () => {
  const tenantId = '11111111-1111-4111-8111-111111111111';
  const otherTenantId = '44444444-4444-4444-8444-444444444444';
  const actorId = '22222222-2222-4222-8222-222222222222';
  const visitId = '33333333-3333-4333-8333-333333333333';
  const employeeId = '55555555-5555-4555-8555-555555555555';

  const visit = {
    id: visitId,
    tenantId,
    visitNumber: 'SV-2026-0001',
    customerId: null,
    clientName: 'Acme Traders',
    deptName: 'IT',
    technicianId: employeeId,
    teamMembers: null,
    visitDate: '2026-04-01',
    clientCallTime: null,
    timeStarted: '09:00:00',
    timeEnded: '11:00:00',
    totalHours: '2',
    visitType: 'ONPREMISE' as const,
    category: 'Hardware',
    priority: 'High',
    issueDescription: 'Printer down',
    actionTaken: 'Replaced toner',
    partsUsed: null,
    status: 'PENDING' as const,
    createdBy: actorId,
    createdAt: new Date('2026-03-01T00:00:00.000Z'),
    updatedAt: new Date('2026-03-01T00:00:00.000Z'),
  };

  const record = {
    visit,
    technicianFirstName: 'Ujwal',
    technicianLastName: 'Shakya',
  };

  const repository = {
    latestSupportNumber: jest.fn(),
    listSupport: jest.fn(),
    listMySupport: jest.fn(),
    findSupport: jest.fn(),
    createSupport: jest.fn(),
    updateSupport: jest.fn(),
    listField: jest.fn(),
    listMyField: jest.fn(),
    findField: jest.fn(),
    createField: jest.fn(),
    updateField: jest.fn(),
  };

  const employeesService = {
    requireLinkedEmployee: jest.fn(),
    findById: jest.fn(),
  };

  const permissionsService = {
    hasAll: jest.fn(),
  };

  const customersFacade = {
    findById: jest.fn(),
  };

  const service = new VisitsService(
    repository as unknown as VisitsRepository,
    employeesService as unknown as EmployeesService,
    permissionsService as unknown as PermissionsService,
    customersFacade as unknown as CustomersFacade,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    repository.latestSupportNumber.mockResolvedValue(null);
    repository.createSupport.mockResolvedValue(visit);
    repository.findSupport.mockResolvedValue(record);
    repository.listSupport.mockResolvedValue([record]);
    employeesService.requireLinkedEmployee.mockResolvedValue({
      id: employeeId,
      firstName: 'Ujwal',
      lastName: 'Shakya',
    });
    employeesService.findById.mockResolvedValue({ id: employeeId });
    permissionsService.hasAll.mockResolvedValue(true);
  });

  it('lists support visits for the current company only', async () => {
    const result = await service.listSupport(tenantId);

    expect(repository.listSupport).toHaveBeenCalledWith(tenantId);
    expect(repository.listSupport).not.toHaveBeenCalledWith(otherTenantId);
    expect(result[0]?.visitNumber).toBe('SV-2026-0001');
  });

  it('allocates visit numbers independently per tenant year', async () => {
    repository.latestSupportNumber
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce('SV-2026-0001');

    const first = await service.nextSupportNumber(tenantId, '2026-04-01');
    const other = await service.nextSupportNumber(otherTenantId, '2026-04-01');
    const second = await service.nextSupportNumber(tenantId, '2026-04-15');

    expect(first).toBe('SV-2026-0001');
    expect(other).toBe('SV-2026-0001');
    expect(second).toBe('SV-2026-0002');
    expect(repository.latestSupportNumber).toHaveBeenNthCalledWith(
      1,
      tenantId,
      2026,
    );
    expect(repository.latestSupportNumber).toHaveBeenNthCalledWith(
      2,
      otherTenantId,
      2026,
    );
  });

  it('creates a support visit with a tenant-scoped visit number', async () => {
    repository.latestSupportNumber.mockResolvedValue('SV-2026-0003');

    await service.createSupport(tenantId, actorId, {
      clientName: 'Acme Traders',
      visitDate: '2026-04-01',
      visitType: 'REMOTE',
    });

    expect(repository.createSupport).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId,
        visitNumber: 'SV-2026-0004',
        technicianId: employeeId,
        createdBy: actorId,
      }),
    );
  });

  it('does not load a support visit from another company', async () => {
    repository.findSupport.mockResolvedValue(null);

    await expect(
      service.findSupport(otherTenantId, actorId, 'HR', visitId),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.findSupport).toHaveBeenCalledWith(otherTenantId, visitId);
  });

  it('maps a duplicate visit number to a conflict', async () => {
    repository.createSupport.mockRejectedValue({ code: '23505' });

    await expect(
      service.createSupport(tenantId, actorId, {
        clientName: 'Acme Traders',
        visitDate: '2026-04-01',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
