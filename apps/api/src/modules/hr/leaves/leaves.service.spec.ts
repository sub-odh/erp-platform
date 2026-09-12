import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import type { EmployeeResponseDto } from '../employees/dto/employee-response.dto';
import type { EmployeesRepository } from '../employees/employees.repository';
import type { EmployeesService } from '../employees/employees.service';
import { LeavesService } from './leaves.service';
import type { LeaveRequestRecord, LeavesRepository } from './leaves.repository';

describe('LeavesService', () => {
  const tenantId = '11111111-1111-4111-8111-111111111111';
  const otherTenantId = '44444444-4444-4444-8444-444444444444';
  const actorId = '22222222-2222-4222-8222-222222222222';
  const employeeId = '33333333-3333-4333-8333-333333333333';
  const otherEmployeeId = '55555555-5555-4555-8555-555555555555';
  const requestId = '66666666-6666-4666-8666-666666666666';

  const linkedEmployee = {
    id: employeeId,
    tenantId,
    userId: actorId,
    employeeCode: '007',
    firstName: 'Ujwal',
    lastName: 'Shakya',
    annualLeaveBal: '21.00',
    sickLeaveBal: '15.00',
    casualLeaveBal: '12.00',
    annualLeaveEnabled: true,
    managerId: null,
    status: 'ACTIVE' as const,
  };

  const employeeResponse = {
    id: employeeId,
    employeeCode: '007',
    firstName: 'Ujwal',
    lastName: 'Shakya',
    status: 'ACTIVE',
    annualLeaveBal: 21,
    sickLeaveBal: 15,
    casualLeaveBal: 12,
    annualLeaveEnabled: true,
    managerId: null,
    userId: actorId,
  } as EmployeeResponseDto;

  const pendingRequest = {
    id: requestId,
    tenantId,
    employeeId,
    leaveType: 'ANNUAL' as const,
    substituteId: null,
    referredBy: null,
    peerVouched: false,
    startDate: '2026-09-20',
    endDate: '2026-09-21',
    days: '2.00',
    isHalfDay: false,
    reason: 'Family event',
    status: 'PENDING' as const,
    approvedBy: null,
    adminComment: null,
    createdBy: actorId,
    createdAt: new Date('2026-09-13T00:00:00.000Z'),
    updatedAt: new Date('2026-09-13T00:00:00.000Z'),
  };

  const pendingRecord: LeaveRequestRecord = {
    request: pendingRequest,
    employee: {
      id: employeeId,
      employeeCode: '007',
      firstName: 'Ujwal',
      lastName: 'Shakya',
      designation: 'Presales Manager',
      department: 'Information Technology',
      photoUrl: null,
      annualLeaveBal: '21.00',
      sickLeaveBal: '15.00',
      casualLeaveBal: '12.00',
      annualLeaveEnabled: true,
    },
    substitute: null,
  };

  const repository = {
    findById: jest.fn(),
    findRecord: jest.fn(),
    listPending: jest.fn(),
    listHistory: jest.fn(),
    listApprovedOnDate: jest.fn(),
    listByEmployee: jest.fn(),
    listTopTakers: jest.fn(),
    listActiveBalances: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const employeesService = {
    requireLinkedEmployee: jest.fn(),
    findById: jest.fn(),
    directory: jest.fn(),
  };

  const employeesRepository = {
    updateLeaveBalances: jest.fn(),
  };

  const service = new LeavesService(
    repository as unknown as LeavesRepository,
    employeesService as unknown as EmployeesService,
    employeesRepository as unknown as EmployeesRepository,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    employeesService.requireLinkedEmployee.mockResolvedValue(linkedEmployee);
    employeesService.findById.mockResolvedValue(employeeResponse);
    employeesRepository.updateLeaveBalances.mockResolvedValue(linkedEmployee);
    repository.findById.mockResolvedValue(pendingRequest);
    repository.findRecord.mockResolvedValue(pendingRecord);
    repository.create.mockResolvedValue(pendingRequest);
    repository.update.mockResolvedValue({
      ...pendingRequest,
      status: 'APPROVED',
    });
    repository.delete.mockResolvedValue(true);
    repository.listPending.mockResolvedValue([pendingRecord]);
    repository.listHistory.mockResolvedValue([]);
    repository.listApprovedOnDate.mockResolvedValue([]);
    repository.listTopTakers.mockResolvedValue([]);
    repository.listActiveBalances.mockResolvedValue([]);
    repository.listByEmployee.mockResolvedValue([pendingRecord]);
  });

  it('lists dashboard data for the current company only', async () => {
    const result = await service.dashboard(tenantId);

    expect(repository.listPending).toHaveBeenCalledWith(tenantId);
    expect(repository.listHistory).toHaveBeenCalledWith(tenantId, 100);
    expect(repository.listApprovedOnDate).toHaveBeenCalledWith(
      tenantId,
      expect.any(String),
    );
    expect(repository.listTopTakers).toHaveBeenCalledWith(tenantId, 10);
    expect(repository.listActiveBalances).toHaveBeenCalledWith(tenantId);
    expect(repository.listPending).not.toHaveBeenCalledWith(otherTenantId);
    expect(result.pending).toHaveLength(1);
    expect(result.pending[0]?.employee.firstName).toBe('Ujwal');
  });

  it('does not approve a leave request that belongs to another company', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(
      service.approve(otherTenantId, actorId, requestId, {}),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.findById).toHaveBeenCalledWith(otherTenantId, requestId);
    expect(employeesRepository.updateLeaveBalances).not.toHaveBeenCalled();
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('deducts the matching balance when a pending request is approved', async () => {
    await service.approve(tenantId, actorId, requestId, {
      adminComment: 'Approved',
    });

    expect(employeesRepository.updateLeaveBalances).toHaveBeenCalledWith(
      tenantId,
      employeeId,
      { annualLeaveBal: '19.00' },
    );
    expect(repository.update).toHaveBeenCalledWith(
      tenantId,
      requestId,
      expect.objectContaining({
        status: 'APPROVED',
        approvedBy: actorId,
        adminComment: 'Approved',
      }),
    );
  });

  it('does not deduct a balance when a pending request is rejected', async () => {
    repository.update.mockResolvedValue({
      ...pendingRequest,
      status: 'REJECTED',
    });

    await service.reject(tenantId, actorId, requestId, {
      adminComment: 'Cover is thin',
    });

    expect(employeesRepository.updateLeaveBalances).not.toHaveBeenCalled();
    expect(repository.update).toHaveBeenCalledWith(
      tenantId,
      requestId,
      expect.objectContaining({
        status: 'REJECTED',
        approvedBy: actorId,
      }),
    );
  });

  it('rejects an annual leave request when annual leave is disabled', async () => {
    employeesService.requireLinkedEmployee.mockResolvedValue({
      ...linkedEmployee,
      annualLeaveEnabled: false,
    });

    await expect(
      service.create(tenantId, actorId, {
        leaveType: 'ANNUAL',
        startDate: '2026-09-20',
        endDate: '2026-09-21',
        days: 2,
        reason: 'Travel',
      }),
    ).rejects.toEqual(
      expect.objectContaining<Partial<BadRequestException>>({
        message: 'Annual leave is not enabled for this employee',
      }),
    );
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('lets the owner revoke only a pending request of their own', async () => {
    await service.revoke(tenantId, actorId, requestId);

    expect(repository.delete).toHaveBeenCalledWith(tenantId, requestId);

    repository.delete.mockClear();
    repository.findById.mockResolvedValue({
      ...pendingRequest,
      status: 'APPROVED',
    });

    await expect(
      service.revoke(tenantId, actorId, requestId),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.delete).not.toHaveBeenCalled();

    repository.findById.mockResolvedValue({
      ...pendingRequest,
      employeeId: otherEmployeeId,
    });

    await expect(
      service.revoke(tenantId, actorId, requestId),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(repository.delete).not.toHaveBeenCalled();
  });

  it('logs emergency leave as approved and deducts the balance', async () => {
    const approved = {
      ...pendingRequest,
      status: 'APPROVED' as const,
      peerVouched: true,
      approvedBy: actorId,
    };
    repository.create.mockResolvedValue(approved);
    repository.findRecord.mockResolvedValue({
      ...pendingRecord,
      request: approved,
    });

    await service.createEmergency(tenantId, actorId, {
      employeeId,
      leaveType: 'SICK',
      startDate: '2026-09-13',
      endDate: '2026-09-13',
      days: 1,
      reason: 'Fever',
      adminComment: 'Logged by HR',
    });

    expect(employeesRepository.updateLeaveBalances).toHaveBeenCalledWith(
      tenantId,
      employeeId,
      { sickLeaveBal: '14.00' },
    );
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId,
        employeeId,
        leaveType: 'SICK',
        days: '1.00',
        status: 'APPROVED',
        peerVouched: true,
        approvedBy: actorId,
        createdBy: actorId,
      }),
    );
  });

  it('refuses approval when the remaining balance would go below zero', async () => {
    employeesService.findById.mockResolvedValue({
      ...employeeResponse,
      annualLeaveBal: 1,
    });

    await expect(
      service.approve(tenantId, actorId, requestId, {}),
    ).rejects.toEqual(
      expect.objectContaining<Partial<BadRequestException>>({
        message: 'Leave balance is not enough for this request',
      }),
    );
    expect(employeesRepository.updateLeaveBalances).not.toHaveBeenCalled();
    expect(repository.update).not.toHaveBeenCalled();
  });
});
