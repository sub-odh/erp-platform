import { ConflictException, NotFoundException } from '@nestjs/common';

import { HolidaysService } from './holidays.service';

describe('HolidaysService', () => {
  const tenantId = '11111111-1111-4111-8111-111111111111';
  const actorId = '22222222-2222-4222-8222-222222222222';
  const holidayId = '33333333-3333-4333-8333-333333333333';
  const otherTenantId = '44444444-4444-4444-8444-444444444444';

  const holiday = {
    id: holidayId,
    tenantId,
    title: 'Nepali New Year',
    description: 'Baisakh 1',
    holidayDate: '2026-04-14',
    createdBy: actorId,
    updatedBy: actorId,
    createdAt: new Date('2026-03-22T00:00:00.000Z'),
    updatedAt: new Date('2026-03-22T00:00:00.000Z'),
  };

  const repository = {
    list: jest.fn(),
    findById: jest.fn(),
    findByDate: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const service = new HolidaysService(repository);

  beforeEach(() => {
    jest.clearAllMocks();
    repository.findByDate.mockResolvedValue(null);
    repository.findById.mockResolvedValue(holiday);
    repository.create.mockResolvedValue(holiday);
    repository.update.mockResolvedValue(holiday);
    repository.delete.mockResolvedValue(true);
  });

  it('lists holidays for the current company only', async () => {
    repository.list.mockResolvedValue([holiday]);

    const result = await service.list(tenantId);

    expect(repository.list).toHaveBeenCalledWith(tenantId);
    expect(repository.list).not.toHaveBeenCalledWith(otherTenantId);
    expect(result).toEqual([holiday]);
  });

  it('creates a company-scoped holiday with a trimmed title', async () => {
    await service.create(tenantId, actorId, {
      title: 'Buddha Jayanti',
      description: 'Full moon of Baisakh',
      holidayDate: '2026-05-01',
    });

    expect(repository.findByDate).toHaveBeenCalledWith(
      tenantId,
      '2026-05-01',
      undefined,
    );
    expect(repository.create).toHaveBeenCalledWith({
      tenantId,
      title: 'Buddha Jayanti',
      description: 'Full moon of Baisakh',
      holidayDate: '2026-05-01',
      createdBy: actorId,
      updatedBy: actorId,
    });
  });

  it('rejects a second holiday on the same company date', async () => {
    repository.findByDate.mockResolvedValue(holiday);

    await expect(
      service.create(tenantId, actorId, {
        title: 'Labour Day',
        holidayDate: '2026-04-14',
      }),
    ).rejects.toEqual(
      expect.objectContaining<Partial<ConflictException>>({
        message: 'A holiday is already marked for this date in the company',
      }),
    );
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('maps a database unique violation to a conflict', async () => {
    repository.create.mockRejectedValue({ code: '23505' });

    await expect(
      service.create(tenantId, actorId, {
        title: 'Labour Day',
        holidayDate: '2026-05-01',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('does not update a holiday that belongs to another company', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(
      service.update(otherTenantId, actorId, holidayId, {
        title: 'Moved',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('deletes only inside the current company', async () => {
    await service.remove(tenantId, holidayId);

    expect(repository.findById).toHaveBeenCalledWith(tenantId, holidayId);
    expect(repository.delete).toHaveBeenCalledWith(tenantId, holidayId);
  });
});
