import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

import { MediaService } from '../../media/media.service';
import { EmployeesRepository } from './employees.repository';
import { EmployeesService } from './employees.service';

describe('EmployeesService', () => {
  const tenantId = '11111111-1111-4111-8111-111111111111';
  const actorId = '22222222-2222-4222-8222-222222222222';
  const employeeId = '33333333-3333-4333-8333-333333333333';
  const otherTenantId = '44444444-4444-4444-8444-444444444444';

  const repository = {
    list: jest.fn(),
    findById: jest.fn(),
    findByCode: jest.fn(),
    findByUserId: jest.fn(),
    findByDeviceId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findActiveUser: jest.fn(),
    lookups: jest.fn(),
    managerChainIds: jest.fn(),
  };

  const mediaService = {
    uploadImage: jest.fn(),
    deleteImage: jest.fn(),
  };

  const service = new EmployeesService(
    repository as unknown as EmployeesRepository,
    mediaService as unknown as MediaService,
  );

  const employee = {
    id: employeeId,
    tenantId,
    userId: null,
    employeeCode: '007',
    attendanceDeviceId: null,
    firstName: 'Ujwal',
    lastName: 'Shakya',
    fatherName: null,
    motherName: null,
    dateOfBirth: '1990-05-24',
    gender: 'MALE' as const,
    maritalStatus: 'SINGLE' as const,
    spouseName: null,
    workEmail: 'ujwal@example.com',
    phone: null,
    altPhone: null,
    emergencyContactName: null,
    emergencyContactPhone: null,
    emergencyContactRelation: null,
    citizenshipNumber: null,
    panNumber: null,
    permanentAddress: null,
    currentAddress: null,
    bankName: null,
    bankBranch: null,
    bankAccountName: null,
    bankAccountNumber: null,
    joinDate: '2025-09-17',
    resignationDate: null,
    designation: 'Presales Manager',
    department: 'Information Technology',
    qualification: null,
    pastExperience: null,
    salary: '0.00',
    managerId: null,
    lastIncrementMonth: null,
    hasSalesTarget: false,
    salesTarget: null,
    yearlySalesTarget: null,
    targetStartDate: null,
    targetEndDate: null,
    status: 'ACTIVE' as const,
    photoUrl: null,
    photoFileName: null,
    photoMimeType: null,
    photoSize: null,
    signatureUrl: null,
    signatureFileName: null,
    signatureMimeType: null,
    signatureSize: null,
    createdBy: actorId,
    updatedBy: actorId,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    repository.findById.mockResolvedValue({
      employee,
      user: null,
      manager: null,
    });
    repository.findByCode.mockResolvedValue(null);
    repository.findByUserId.mockResolvedValue(null);
    repository.findByDeviceId.mockResolvedValue(null);
    repository.managerChainIds.mockResolvedValue([]);
    repository.create.mockResolvedValue(employee);
    repository.update.mockResolvedValue(employee);
  });

  it('creates an employee inside the authenticated tenant only', async () => {
    const created = await service.create(tenantId, actorId, {
      employeeCode: '007',
      firstName: 'Ujwal',
      lastName: 'Shakya',
      department: 'Information Technology',
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId,
        employeeCode: '007',
        firstName: 'Ujwal',
        createdBy: actorId,
      }),
    );
    expect(created.employeeCode).toBe('007');
    expect(created.salary).toBe(0);
  });

  it('lists employees for the current company with designation and department filters', async () => {
    repository.list.mockResolvedValue({
      data: [{ employee, user: null, manager: null }],
      total: 1,
      counts: { active: 1, inactive: 0, total: 1 },
    });

    const result = await service.list(tenantId, {
      status: 'all',
      department: 'Information Technology',
      designation: 'Presales Manager',
      page: 1,
      limit: 20,
      sortBy: 'firstName',
      sortDirection: 'asc',
    });

    expect(repository.list).toHaveBeenCalledWith({
      tenantId,
      search: undefined,
      status: 'all',
      department: 'Information Technology',
      designation: 'Presales Manager',
      page: 1,
      limit: 20,
      sortBy: 'firstName',
      sortDirection: 'asc',
    });
    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.employeeCode).toBe('007');
    expect(repository.list).not.toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: otherTenantId }),
    );
  });

  it('forwards directory search within the current company only', async () => {
    repository.list.mockResolvedValue({
      data: [],
      total: 0,
      counts: { active: 0, inactive: 0, total: 0 },
    });

    await service.list(tenantId, {
      status: 'active',
      search: '007',
      page: 2,
      limit: 20,
      sortBy: 'firstName',
      sortDirection: 'asc',
    });

    expect(repository.list).toHaveBeenCalledWith({
      tenantId,
      search: '007',
      status: 'active',
      department: undefined,
      designation: undefined,
      page: 2,
      limit: 20,
      sortBy: 'firstName',
      sortDirection: 'asc',
    });
    expect(repository.list).not.toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: otherTenantId }),
    );
  });

  it('rejects a duplicate employee code in the same company', async () => {
    repository.findByCode.mockResolvedValue(employee);

    await expect(
      service.create(tenantId, actorId, {
        employeeCode: '007',
        firstName: 'Ujwal',
        lastName: 'Shakya',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('does not allow a user from another company to be linked', async () => {
    repository.findActiveUser.mockResolvedValue(null);

    await expect(
      service.create(tenantId, actorId, {
        employeeCode: '008',
        firstName: 'Ada',
        lastName: 'Lovelace',
        userId: '55555555-5555-4555-8555-555555555555',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('does not allow an employee to report to themselves', async () => {
    await expect(
      service.update(tenantId, actorId, employeeId, {
        managerId: employeeId,
      }),
    ).rejects.toThrow('An employee cannot report to themselves');
  });

  it('rejects a reporting manager from another tenant', async () => {
    repository.findById.mockImplementation((orgId: string, id: string) => {
      if (id === employeeId && orgId === tenantId) {
        return Promise.resolve({ employee, user: null, manager: null });
      }

      return Promise.resolve(null);
    });

    await expect(
      service.update(tenantId, actorId, employeeId, {
        managerId: '66666666-6666-4666-8666-666666666666',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(repository.findById).toHaveBeenCalledWith(
      tenantId,
      '66666666-6666-4666-8666-666666666666',
    );
    expect(repository.findById).not.toHaveBeenCalledWith(
      otherTenantId,
      expect.anything(),
    );
  });

  it('deactivates and restores inside the current company only', async () => {
    repository.findById.mockResolvedValue({
      employee: { ...employee, status: 'ACTIVE' },
      user: null,
      manager: null,
    });

    await service.deactivate(tenantId, actorId, employeeId);

    expect(repository.update).toHaveBeenCalledWith(
      tenantId,
      employeeId,
      expect.objectContaining({ status: 'INACTIVE' }),
    );

    repository.findById.mockResolvedValue({
      employee: { ...employee, status: 'INACTIVE' },
      user: null,
      manager: null,
    });

    await service.restore(tenantId, actorId, employeeId);

    expect(repository.update).toHaveBeenCalledWith(
      tenantId,
      employeeId,
      expect.objectContaining({ status: 'ACTIVE' }),
    );
  });

  it('throws when the employee is outside the tenant', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(
      service.findById(otherTenantId, employeeId),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects a reporting manager that would create a cycle', async () => {
    const managerId = '77777777-7777-4777-8777-777777777777';

    repository.findById.mockImplementation((_orgId: string, id: string) => {
      if (id === employeeId) {
        return Promise.resolve({ employee, user: null, manager: null });
      }

      if (id === managerId) {
        return Promise.resolve({
          employee: { ...employee, id: managerId, employeeCode: '008' },
          user: null,
          manager: null,
        });
      }

      return Promise.resolve(null);
    });
    repository.managerChainIds.mockResolvedValue([employeeId]);

    await expect(
      service.update(tenantId, actorId, employeeId, { managerId }),
    ).rejects.toThrow('Reporting manager would create a circular hierarchy');
  });
});
