import { ConflictException, NotFoundException } from '@nestjs/common';

import { PermissionsService } from '../../auth/permissions/permissions.service';
import { EmployeesService } from '../employees/employees.service';
import { HallsRepository } from './halls.repository';
import { HallsService } from './halls.service';

describe('HallsService', () => {
  const tenantId = '11111111-1111-4111-8111-111111111111';
  const otherTenantId = '44444444-4444-4444-8444-444444444444';
  const actorId = '22222222-2222-4222-8222-222222222222';
  const hallId = '33333333-3333-4333-8333-333333333333';
  const employeeId = '55555555-5555-4555-8555-555555555555';
  const bookingId = '66666666-6666-4666-8666-666666666666';

  const hall = {
    id: hallId,
    tenantId,
    hallName: 'Board Room',
    location: 'Floor 2',
    capacity: 12,
    arrangementType: 'BOARDROOM' as const,
    status: 'ACTIVE' as const,
    createdBy: actorId,
    createdAt: new Date('2026-03-01T00:00:00.000Z'),
    updatedAt: new Date('2026-03-01T00:00:00.000Z'),
  };

  const booking = {
    id: bookingId,
    tenantId,
    hallId,
    employeeId,
    bookingDate: '2026-04-01',
    startTime: '10:00:00',
    endTime: '11:00:00',
    reason: 'Weekly sync',
    status: 'PENDING' as const,
    createdBy: actorId,
    createdAt: new Date('2026-03-01T00:00:00.000Z'),
    updatedAt: new Date('2026-03-01T00:00:00.000Z'),
  };

  const bookingRecord = {
    booking,
    hallName: 'Board Room',
    employeeFirstName: 'Ujwal',
    employeeLastName: 'Shakya',
  };

  const repository = {
    listHalls: jest.fn(),
    findHall: jest.fn(),
    createHall: jest.fn(),
    updateHall: jest.fn(),
    deleteHall: jest.fn(),
    listActiveForHallDate: jest.fn(),
    listBookings: jest.fn(),
    findBooking: jest.fn(),
    createBooking: jest.fn(),
    updateBooking: jest.fn(),
  };

  const employeesService = {
    requireLinkedEmployee: jest.fn(),
  };

  const permissionsService = {
    hasAll: jest.fn(),
  };

  const service = new HallsService(
    repository as unknown as HallsRepository,
    employeesService as unknown as EmployeesService,
    permissionsService as unknown as PermissionsService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    repository.findHall.mockResolvedValue(hall);
    repository.listHalls.mockResolvedValue([hall]);
    repository.listActiveForHallDate.mockResolvedValue([]);
    repository.createBooking.mockResolvedValue(booking);
    repository.findBooking.mockResolvedValue(bookingRecord);
    employeesService.requireLinkedEmployee.mockResolvedValue({
      id: employeeId,
      firstName: 'Ujwal',
      lastName: 'Shakya',
    });
    permissionsService.hasAll.mockResolvedValue(false);
  });

  it('lists halls for the current company only', async () => {
    const result = await service.listHalls(tenantId);

    expect(repository.listHalls).toHaveBeenCalledWith(tenantId);
    expect(repository.listHalls).not.toHaveBeenCalledWith(otherTenantId);
    expect(result[0]?.hallName).toBe('Board Room');
  });

  it('does not update a hall that belongs to another company', async () => {
    repository.findHall.mockResolvedValue(null);

    await expect(
      service.updateHall(otherTenantId, hallId, { hallName: 'Moved' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.updateHall).not.toHaveBeenCalled();
  });

  it('rejects overlapping pending or confirmed bookings on the same hall and date', async () => {
    repository.listActiveForHallDate.mockResolvedValue([booking]);

    await expect(
      service.book(tenantId, actorId, {
        hallId,
        bookingDate: '2026-04-01',
        startTime: '10:30',
        endTime: '11:30',
        reason: 'Conflict',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(repository.createBooking).not.toHaveBeenCalled();
  });

  it('allows a booking that does not overlap an existing slot', async () => {
    repository.listActiveForHallDate.mockResolvedValue([booking]);

    await service.book(tenantId, actorId, {
      hallId,
      bookingDate: '2026-04-01',
      startTime: '11:00',
      endTime: '12:00',
      reason: 'Next slot',
    });

    expect(repository.createBooking).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId,
        hallId,
        startTime: '11:00:00',
        endTime: '12:00:00',
        status: 'PENDING',
      }),
    );
  });

  it('lists only the current employee bookings when the user cannot manage halls', async () => {
    repository.listBookings.mockResolvedValue([bookingRecord]);

    await service.listBookings(tenantId, actorId, 'EMPLOYEE');

    expect(repository.listBookings).toHaveBeenCalledWith(tenantId, employeeId);
  });
});
