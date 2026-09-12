import {
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import { PermissionsService } from '../../auth/permissions/permissions.service';
import { MediaService } from '../../media/media.service';
import { EmployeesService } from '../employees/employees.service';
import { MemosRepository } from './memos.repository';
import { MemosService } from './memos.service';

describe('MemosService', () => {
  const tenantId = '11111111-1111-4111-8111-111111111111';
  const otherTenantId = '44444444-4444-4444-8444-444444444444';
  const actorId = '22222222-2222-4222-8222-222222222222';
  const memoId = '33333333-3333-4333-8333-333333333333';
  const employeeId = '55555555-5555-4555-8555-555555555555';
  const verifierId = '66666666-6666-4666-8666-666666666666';

  const memo = {
    id: memoId,
    tenantId,
    title: 'Office relocation',
    content: 'We will move next month.',
    raisedBy: employeeId,
    verifierId,
    currentStep: 4,
    status: 'CONFIRMED' as const,
    verifierSignedBy: verifierId,
    hodSignedBy: employeeId,
    ceoSignedBy: null,
    createdBy: actorId,
    createdAt: new Date('2026-03-01T00:00:00.000Z'),
    updatedAt: new Date('2026-03-01T00:00:00.000Z'),
  };

  const record = {
    memo,
    raisedByFirstName: 'Ujwal',
    raisedByLastName: 'Shakya',
    verifierFirstName: 'Sita',
    verifierLastName: 'Rai',
    verifierSignedFirstName: 'Sita',
    verifierSignedLastName: 'Rai',
    hodSignedFirstName: 'Ujwal',
    hodSignedLastName: 'Shakya',
    ceoSignedFirstName: null,
    ceoSignedLastName: null,
  };

  const repository = {
    list: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    listAttachments: jest.fn(),
    createAttachment: jest.fn(),
  };

  const employeesService = {
    requireLinkedEmployee: jest.fn(),
    findById: jest.fn(),
  };

  const permissionsService = {
    hasAll: jest.fn(),
  };

  const mediaService = {
    uploadDocument: jest.fn(),
    deleteImage: jest.fn(),
  };

  const service = new MemosService(
    repository as unknown as MemosRepository,
    employeesService as unknown as EmployeesService,
    permissionsService as unknown as PermissionsService,
    mediaService as unknown as MediaService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    repository.findById.mockResolvedValue(record);
    repository.list.mockResolvedValue([record]);
    repository.listAttachments.mockResolvedValue([]);
    repository.update.mockResolvedValue(memo);
    employeesService.requireLinkedEmployee.mockResolvedValue({
      id: employeeId,
      firstName: 'Ujwal',
      lastName: 'Shakya',
    });
    employeesService.findById.mockResolvedValue({ id: verifierId });
    permissionsService.hasAll.mockResolvedValue(true);
  });

  it('lists memos for the current company only', async () => {
    const result = await service.list(tenantId);

    expect(repository.list).toHaveBeenCalledWith(tenantId);
    expect(repository.list).not.toHaveBeenCalledWith(otherTenantId);
    expect(result[0]?.raisedByName).toBe('Ujwal Shakya');
  });

  it('creates a pending memo scoped to the authenticated tenant', async () => {
    repository.create.mockResolvedValue(memo);
    repository.findById.mockResolvedValue({
      ...record,
      memo: { ...memo, status: 'PENDING', currentStep: 2 },
    });

    await service.create(tenantId, actorId, {
      title: 'Office relocation',
      content: 'We will move next month.',
      verifierId,
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId,
        raisedBy: employeeId,
        verifierId,
        status: 'PENDING',
        currentStep: 2,
        createdBy: actorId,
      }),
    );
  });

  it('does not approve a memo that belongs to another company', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(
      service.approve(otherTenantId, actorId, memoId),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.findById).toHaveBeenCalledWith(otherTenantId, memoId);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('approves a confirmed memo for the current company', async () => {
    repository.findById
      .mockResolvedValueOnce(record)
      .mockResolvedValueOnce({
        ...record,
        memo: { ...memo, status: 'APPROVED', ceoSignedBy: employeeId },
        ceoSignedFirstName: 'Ujwal',
        ceoSignedLastName: 'Shakya',
      });

    const result = await service.approve(tenantId, actorId, memoId);

    expect(repository.update).toHaveBeenCalledWith(
      tenantId,
      memoId,
      expect.objectContaining({
        status: 'APPROVED',
        ceoSignedBy: employeeId,
      }),
    );
    expect(result.status).toBe('APPROVED');
  });

  it('rejects verification when the actor is not the verifier and has no manage permission', async () => {
    permissionsService.hasAll.mockResolvedValue(false);
    repository.findById.mockResolvedValue({
      ...record,
      memo: { ...memo, status: 'PENDING', currentStep: 2 },
    });

    await expect(
      service.verify(tenantId, actorId, 'EMPLOYEE', memoId),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(repository.update).not.toHaveBeenCalled();
  });
});
