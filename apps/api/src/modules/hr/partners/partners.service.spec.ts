import { NotFoundException } from '@nestjs/common';

import { MediaService } from '../../media/media.service';
import { EmployeesService } from '../employees/employees.service';
import { PartnersRepository } from './partners.repository';
import { PartnersService } from './partners.service';

describe('PartnersService', () => {
  const tenantId = '11111111-1111-4111-8111-111111111111';
  const otherTenantId = '44444444-4444-4444-8444-444444444444';
  const actorId = '22222222-2222-4222-8222-222222222222';
  const partnerId = '33333333-3333-4333-8333-333333333333';
  const employeeId = '55555555-5555-4555-8555-555555555555';

  const partner = {
    id: partnerId,
    tenantId,
    name: 'Ncell',
    portalUrl: 'https://portal.ncell.com',
    websiteUrl: 'https://ncell.com',
    logoUrl: null,
    logoFileName: null,
    logoMimeType: null,
    logoSize: null,
    createdBy: actorId,
    createdAt: new Date('2026-03-01T00:00:00.000Z'),
    updatedAt: new Date('2026-03-01T00:00:00.000Z'),
  };

  const repository = {
    list: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    listAssignments: jest.fn(),
    replaceAssignments: jest.fn(),
  };

  const employeesService = {
    findById: jest.fn(),
  };

  const mediaService = {
    uploadImage: jest.fn(),
    deleteImage: jest.fn(),
  };

  const service = new PartnersService(
    repository as unknown as PartnersRepository,
    employeesService as unknown as EmployeesService,
    mediaService as unknown as MediaService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    repository.findById.mockResolvedValue(partner);
    repository.list.mockResolvedValue([partner]);
    repository.listAssignments.mockResolvedValue([]);
    repository.create.mockResolvedValue(partner);
    repository.update.mockResolvedValue(partner);
    repository.delete.mockResolvedValue(true);
    employeesService.findById.mockResolvedValue({ id: employeeId });
  });

  it('lists partners for the current company only', async () => {
    const result = await service.list(tenantId);

    expect(repository.list).toHaveBeenCalledWith(tenantId);
    expect(repository.list).not.toHaveBeenCalledWith(otherTenantId);
    expect(result[0]?.name).toBe('Ncell');
  });

  it('creates a partner with assignments inside the authenticated tenant', async () => {
    await service.create(tenantId, actorId, {
      name: 'Ncell',
      portalUrl: 'https://portal.ncell.com',
      websiteUrl: 'https://ncell.com',
      employeeIds: [employeeId],
    });

    expect(employeesService.findById).toHaveBeenCalledWith(tenantId, employeeId);
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId,
        name: 'Ncell',
        createdBy: actorId,
      }),
    );
    expect(repository.replaceAssignments).toHaveBeenCalledWith(
      tenantId,
      partnerId,
      [employeeId],
    );
  });

  it('does not update a partner that belongs to another company', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(
      service.update(otherTenantId, partnerId, { name: 'Moved' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('refuses assignments to employees outside the current company', async () => {
    employeesService.findById.mockRejectedValue(
      new NotFoundException('Employee was not found'),
    );

    await expect(
      service.create(tenantId, actorId, {
        name: 'Ncell',
        employeeIds: [employeeId],
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.create).not.toHaveBeenCalled();
  });
});
