import { BadRequestException, NotFoundException } from '@nestjs/common';

import { ExpensesService } from './expenses.service';

describe('ExpensesService', () => {
  const tenantId = '11111111-1111-4111-8111-111111111111';
  const otherTenantId = '44444444-4444-4444-8444-444444444444';
  const actorId = '22222222-2222-4222-8222-222222222222';
  const employeeId = '55555555-5555-4555-8555-555555555555';
  const otherEmployeeId = '66666666-6666-4666-8666-666666666666';
  const expenseId = '33333333-3333-4333-8333-333333333333';

  const employee = {
    id: employeeId,
    firstName: 'Hari',
    lastName: 'Sharma',
  };

  const pendingExpense = {
    id: expenseId,
    tenantId,
    employeeId,
    expenseType: 'TADA' as const,
    amount: '1250.00',
    description: 'Client visit',
    requestDate: '2026-09-10',
    origin: 'Kathmandu',
    destination: 'Pokhara',
    status: 'PENDING' as const,
    approvedBy: null,
    remarks: null,
    reimbursementStatus: 'PENDING' as const,
    createdBy: actorId,
    createdAt: new Date('2026-09-10T00:00:00.000Z'),
    updatedAt: new Date('2026-09-10T00:00:00.000Z'),
    employeeFirstName: 'Hari',
    employeeLastName: 'Sharma',
  };

  const repository = {
    listByTenant: jest.fn(),
    listByEmployee: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };

  const employeesService = {
    requireLinkedEmployee: jest.fn(),
  };

  const service = new ExpensesService(
    repository as never,
    employeesService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    employeesService.requireLinkedEmployee.mockResolvedValue(employee);
    repository.findById.mockResolvedValue(pendingExpense);
    repository.create.mockResolvedValue(pendingExpense);
    repository.update.mockResolvedValue({
      ...pendingExpense,
      status: 'APPROVED',
    });
    repository.listByTenant.mockResolvedValue([pendingExpense]);
    repository.listByEmployee.mockResolvedValue([pendingExpense]);
  });

  it('lists TADA expenses for the current company only', async () => {
    const result = await service.list(tenantId);

    expect(repository.listByTenant).toHaveBeenCalledWith(tenantId);
    expect(repository.listByTenant).not.toHaveBeenCalledWith(otherTenantId);
    expect(result[0]).toEqual(
      expect.objectContaining({
        employeeName: 'Hari Sharma',
        amount: 1250,
        travelDate: '2026-09-10',
        purpose: 'Client visit',
      }),
    );
  });

  it('lets an employee see only their own TADA records', async () => {
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

  it('creates a TADA request for the linked employee with a numeric amount', async () => {
    await service.create(tenantId, actorId, {
      travelDate: '2026-09-12',
      origin: 'Kathmandu',
      destination: 'Biratnagar',
      amount: 890.5,
      purpose: 'Site visit',
    });

    expect(repository.create).toHaveBeenCalledWith({
      tenantId,
      employeeId,
      expenseType: 'TADA',
      amount: '890.50',
      description: 'Site visit',
      requestDate: '2026-09-12',
      origin: 'Kathmandu',
      destination: 'Biratnagar',
      status: 'PENDING',
      createdBy: actorId,
    });
  });

  it('does not approve a TADA request that belongs to another company', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(
      service.approve(otherTenantId, actorId, expenseId, {}),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.findById).toHaveBeenCalledWith(otherTenantId, expenseId);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('rejects approval when the request is not pending', async () => {
    repository.findById.mockResolvedValue({
      ...pendingExpense,
      status: 'APPROVED',
    });

    await expect(
      service.approve(tenantId, actorId, expenseId, {}),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.update).not.toHaveBeenCalled();
  });
});
