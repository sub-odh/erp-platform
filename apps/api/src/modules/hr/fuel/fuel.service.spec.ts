import { BadRequestException, NotFoundException } from '@nestjs/common';

import { FuelService } from './fuel.service';

describe('FuelService', () => {
  const tenantId = '11111111-1111-4111-8111-111111111111';
  const otherTenantId = '44444444-4444-4444-8444-444444444444';
  const actorId = '22222222-2222-4222-8222-222222222222';
  const employeeId = '55555555-5555-4555-8555-555555555555';
  const otherEmployeeId = '66666666-6666-4666-8666-666666666666';
  const recordId = '33333333-3333-4333-8333-333333333333';

  const employee = {
    id: employeeId,
    firstName: 'Sita',
    lastName: 'Karki',
  };

  const pendingRecord = {
    id: recordId,
    tenantId,
    employeeId,
    vehicleNo: 'Ba 1 Pa 1234',
    fuelDate: '2026-09-10',
    amount: '2000.00',
    liters: '10.00',
    purpose: 'Field visit',
    status: 'PENDING' as const,
    approvedBy: null,
    reimbursementStatus: 'PENDING',
    reimbursedAt: null,
    reimbursedBy: null,
    paymentReference: null,
    createdBy: actorId,
    createdAt: new Date('2026-09-10T00:00:00.000Z'),
    updatedAt: new Date('2026-09-10T00:00:00.000Z'),
    employeeFirstName: 'Sita',
    employeeLastName: 'Karki',
  };

  const repository = {
    listByTenant: jest.fn(),
    listByEmployee: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    totals: jest.fn(),
    getSettings: jest.fn(),
    upsertSettings: jest.fn(),
  };

  const employeesService = {
    requireLinkedEmployee: jest.fn(),
  };

  const service = new FuelService(repository as never, employeesService as never);

  beforeEach(() => {
    jest.clearAllMocks();
    employeesService.requireLinkedEmployee.mockResolvedValue(employee);
    repository.findById.mockResolvedValue(pendingRecord);
    repository.create.mockImplementation(async (values) => ({
      ...pendingRecord,
      ...values,
    }));
    repository.update.mockResolvedValue({
      ...pendingRecord,
      status: 'APPROVED',
    });
    repository.listByTenant.mockResolvedValue([pendingRecord]);
    repository.listByEmployee.mockResolvedValue([pendingRecord]);
    repository.totals.mockResolvedValue({ liters: '10.00', amount: '2000.00' });
    repository.getSettings.mockResolvedValue({
      tenantId,
      threshold: '250.00',
      updatedBy: actorId,
      updatedAt: new Date(),
    });
  });

  it('lists fuel records for the current company only with totals', async () => {
    const result = await service.list(tenantId);

    expect(repository.listByTenant).toHaveBeenCalledWith(tenantId);
    expect(repository.listByTenant).not.toHaveBeenCalledWith(otherTenantId);
    expect(repository.totals).toHaveBeenCalledWith(tenantId);
    expect(result.threshold).toBe(250);
    expect(result.totals).toEqual({ liters: 10, amount: 2000 });
    expect(result.records[0]).toEqual(
      expect.objectContaining({
        employeeName: 'Sita Karki',
        amount: 2000,
        liters: 10,
        pricePerLiter: 200,
      }),
    );
  });

  it('lets an employee see only their own fuel records', async () => {
    const result = await service.listMine(tenantId, actorId);

    expect(employeesService.requireLinkedEmployee).toHaveBeenCalledWith(
      tenantId,
      actorId,
    );
    expect(repository.listByEmployee).toHaveBeenCalledWith(
      tenantId,
      employeeId,
    );
    expect(repository.listByEmployee).not.toHaveBeenCalledWith(
      tenantId,
      otherEmployeeId,
    );
    expect(result).toHaveLength(1);
  });

  it('flags a record when price per liter exceeds the threshold', async () => {
    const result = await service.create(tenantId, actorId, {
      vehicleNo: 'Ba 2 Pa 9876',
      fuelDate: '2026-09-12',
      amount: 3000,
      liters: 10,
      purpose: 'Site run',
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId,
        employeeId,
        amount: '3000.00',
        liters: '10.00',
        status: 'FLAGGED',
      }),
    );
    expect(result.status).toBe('FLAGGED');
    expect(result.pricePerLiter).toBe(300);
  });

  it('keeps a record pending when price per liter is within the limit', async () => {
    await service.create(tenantId, actorId, {
      vehicleNo: 'Ba 2 Pa 9876',
      fuelDate: '2026-09-12',
      amount: 2000,
      liters: 10,
      purpose: 'Site run',
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'PENDING' }),
    );
  });

  it('does not approve a fuel record that belongs to another company', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(
      service.approve(otherTenantId, actorId, recordId),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.findById).toHaveBeenCalledWith(otherTenantId, recordId);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('reimburses only an approved fuel record', async () => {
    await expect(
      service.reimburse(tenantId, actorId, recordId, {
        paymentReference: 'CHQ-100',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.update).not.toHaveBeenCalled();

    repository.findById.mockResolvedValue({
      ...pendingRecord,
      status: 'APPROVED',
    });
    repository.update.mockResolvedValue({
      ...pendingRecord,
      status: 'REIMBURSED',
      reimbursementStatus: 'PAID',
      paymentReference: 'CHQ-100',
      reimbursedBy: actorId,
    });

    const result = await service.reimburse(tenantId, actorId, recordId, {
      paymentReference: 'CHQ-100',
    });

    expect(repository.update).toHaveBeenCalledWith(
      tenantId,
      recordId,
      expect.objectContaining({
        status: 'REIMBURSED',
        reimbursementStatus: 'PAID',
        paymentReference: 'CHQ-100',
        reimbursedBy: actorId,
      }),
    );
    expect(result.status).toBe('REIMBURSED');
  });
});
