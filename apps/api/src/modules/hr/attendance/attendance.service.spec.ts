import { ConflictException, NotFoundException } from '@nestjs/common';

import type { EmployeesService } from '../employees/employees.service';
import type { HolidaysService } from '../holidays/holidays.service';
import { AttendanceService } from './attendance.service';
import type { AttendanceRepository } from './attendance.repository';

describe('AttendanceService', () => {
  const tenantId = '11111111-1111-4111-8111-111111111111';
  const actorId = '22222222-2222-4222-8222-222222222222';
  const employeeId = '33333333-3333-4333-8333-333333333333';
  const attendanceId = '55555555-5555-4555-8555-555555555555';
  const otherTenantId = '44444444-4444-4444-8444-444444444444';

  const attendance = {
    id: attendanceId,
    tenantId,
    employeeId,
    punchDate: '2026-09-14',
    inTime: '09:05:00',
    outTime: '17:10:00',
    duration: '8h 5m',
    attStatus: 'Present',
    source: 'MANUAL',
    createdBy: actorId,
    updatedBy: actorId,
    createdAt: new Date('2026-09-14T03:20:00.000Z'),
    updatedAt: new Date('2026-09-14T11:25:00.000Z'),
  };

  const listRow = {
    attendance,
    employeeCode: '007',
    firstName: 'Ujwal',
    lastName: 'Shakya',
  };

  const employee = {
    id: employeeId,
    employeeCode: '007',
    firstName: 'Ujwal',
    lastName: 'Shakya',
    designation: 'Presales Manager',
    department: 'Information Technology',
    photoUrl: null,
    managerId: null,
    userId: actorId,
    status: 'ACTIVE' as const,
  };

  const repository = {
    list: jest.fn(),
    findById: jest.fn(),
    findByEmployeeDate: jest.fn(),
    listByEmployee: jest.fn(),
    listInRange: jest.fn(),
    listApprovedLeaves: jest.fn(),
    listFieldVisits: jest.fn(),
    getOfficeSettings: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const employeesService = {
    findById: jest.fn(),
    requireLinkedEmployee: jest.fn(),
    directory: jest.fn(),
  };

  const holidaysService = {
    list: jest.fn(),
  };

  const service = new AttendanceService(
    repository as unknown as AttendanceRepository,
    employeesService as unknown as EmployeesService,
    holidaysService as unknown as HolidaysService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    repository.findById.mockResolvedValue(listRow);
    repository.findByEmployeeDate.mockResolvedValue(null);
    repository.create.mockResolvedValue(attendance);
    repository.update.mockResolvedValue(attendance);
    repository.delete.mockResolvedValue(true);
    repository.getOfficeSettings.mockResolvedValue({
      officeStartTime: '09:00',
      officeEndTime: '17:00',
      timezone: 'Asia/Kathmandu',
    });
    repository.listInRange.mockResolvedValue([]);
    repository.listApprovedLeaves.mockResolvedValue([]);
    repository.listFieldVisits.mockResolvedValue([]);
    employeesService.findById.mockResolvedValue(employee);
    employeesService.requireLinkedEmployee.mockResolvedValue(employee);
    employeesService.directory.mockResolvedValue([employee]);
    holidaysService.list.mockResolvedValue([]);
  });

  it('lists attendance for the current company only', async () => {
    repository.list.mockResolvedValue({ data: [listRow], total: 1 });

    const result = await service.list(tenantId, {
      startDate: '2026-09-01',
      endDate: '2026-09-30',
      page: 1,
      limit: 20,
    });

    expect(repository.list).toHaveBeenCalledWith({
      tenantId,
      search: undefined,
      startDate: '2026-09-01',
      endDate: '2026-09-30',
      page: 1,
      limit: 20,
    });
    expect(repository.list).not.toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: otherTenantId }),
    );
    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.employeeCode).toBe('007');
  });

  it('rejects a second punch for the same employee and date', async () => {
    repository.findByEmployeeDate.mockResolvedValue(attendance);

    await expect(
      service.create(tenantId, actorId, {
        employeeId,
        punchDate: '2026-09-14',
        inTime: '09:00',
      }),
    ).rejects.toEqual(
      expect.objectContaining<Partial<ConflictException>>({
        message:
          'Attendance is already recorded for this employee on this date',
      }),
    );
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('maps a database unique violation to a conflict', async () => {
    repository.create.mockRejectedValue({ code: '23505' });

    await expect(
      service.create(tenantId, actorId, {
        employeeId,
        punchDate: '2026-09-15',
        inTime: '09:00',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('does not update a punch that belongs to another company', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(
      service.update(otherTenantId, actorId, attendanceId, {
        outTime: '18:00',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('returns 404 when checking in without a linked employee', async () => {
    employeesService.requireLinkedEmployee.mockRejectedValue(
      new NotFoundException('No employee profile is linked to this user'),
    );

    await expect(service.checkIn(tenantId, actorId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('marks a Saturday without a punch as Holiday', async () => {
    const result = await service.report(tenantId, {
      startDate: '2026-09-12',
      endDate: '2026-09-12',
    });

    expect(holidaysService.list).toHaveBeenCalledWith(tenantId);
    expect(employeesService.directory).toHaveBeenCalledWith(tenantId);
    expect(result.data).toEqual([
      expect.objectContaining({
        employeeId,
        date: '2026-09-12',
        status: 'Holiday',
        holidayTitle: null,
        leaveName: null,
        punctuality: null,
      }),
    ]);
  });

  it('attaches leave and holiday flags on the report', async () => {
    holidaysService.list.mockResolvedValue([
      {
        id: '66666666-6666-4666-8666-666666666666',
        tenantId,
        title: 'Constitution Day',
        description: null,
        holidayDate: '2026-09-19',
        createdBy: actorId,
        updatedBy: actorId,
        createdAt: new Date('2026-03-01T00:00:00.000Z'),
        updatedAt: new Date('2026-03-01T00:00:00.000Z'),
      },
    ]);
    repository.listApprovedLeaves.mockResolvedValue([
      {
        employeeId,
        leaveType: 'SICK',
        startDate: '2026-09-18',
        endDate: '2026-09-19',
      },
    ]);

    const result = await service.report(tenantId, {
      startDate: '2026-09-18',
      endDate: '2026-09-19',
    });

    expect(result.data).toEqual([
      expect.objectContaining({
        date: '2026-09-18',
        status: 'Absent',
        holidayTitle: null,
        leaveName: 'Sick Leave',
      }),
      expect.objectContaining({
        date: '2026-09-19',
        status: 'Holiday',
        holidayTitle: 'Constitution Day',
        leaveName: 'Sick Leave',
      }),
    ]);
  });

  it('marks punch plus holiday as Holiday + Present', async () => {
    holidaysService.list.mockResolvedValue([
      {
        id: '77777777-7777-4777-8777-777777777777',
        tenantId,
        title: 'Dashain',
        description: null,
        holidayDate: '2026-09-14',
        createdBy: actorId,
        updatedBy: actorId,
        createdAt: new Date('2026-03-01T00:00:00.000Z'),
        updatedAt: new Date('2026-03-01T00:00:00.000Z'),
      },
    ]);
    repository.listInRange.mockResolvedValue([attendance]);

    const result = await service.report(tenantId, {
      startDate: '2026-09-14',
      endDate: '2026-09-14',
    });

    expect(result.data[0]).toEqual(
      expect.objectContaining({
        status: 'Holiday + Present',
        holidayTitle: 'Dashain',
        punctuality: 'Late',
      }),
    );
  });
});
