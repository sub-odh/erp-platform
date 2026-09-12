import type { JwtPayload } from '../../auth/types/jwt-payload.type';
import { AttendanceController } from './attendance.controller';
import type { AttendanceService } from './attendance.service';

describe('AttendanceController', () => {
  const user: JwtPayload = {
    sub: '11111111-1111-4111-8111-111111111111',
    organizationId: '22222222-2222-4222-8222-222222222222',
    email: 'hr@example.com',
    role: 'HR',
    tokenVersion: 0,
  };

  const attendanceService = {
    list: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    checkIn: jest.fn(),
    checkOut: jest.fn(),
    listMine: jest.fn(),
    report: jest.fn(),
  };

  const controller = new AttendanceController(
    attendanceService as unknown as AttendanceService,
  );

  beforeEach(() => jest.clearAllMocks());

  it('lists attendance for the authenticated tenant only', async () => {
    await controller.list(user, {
      startDate: '2026-09-01',
      endDate: '2026-09-30',
      page: 1,
      limit: 20,
    });

    expect(attendanceService.list).toHaveBeenCalledWith(user.organizationId, {
      startDate: '2026-09-01',
      endDate: '2026-09-30',
      page: 1,
      limit: 20,
    });
  });

  it('creates a punch inside the authenticated company', async () => {
    await controller.create(user, {
      employeeId: '33333333-3333-4333-8333-333333333333',
      punchDate: '2026-09-14',
      inTime: '09:00',
    });

    expect(attendanceService.create).toHaveBeenCalledWith(
      user.organizationId,
      user.sub,
      expect.objectContaining({ punchDate: '2026-09-14' }),
    );
  });

  it('checks in as the current user', async () => {
    await controller.checkIn(user);

    expect(attendanceService.checkIn).toHaveBeenCalledWith(
      user.organizationId,
      user.sub,
    );
  });

  it('loads the current user logs only', async () => {
    await controller.listMine(user, {
      startDate: '2026-09-01',
      endDate: '2026-09-30',
    });

    expect(attendanceService.listMine).toHaveBeenCalledWith(
      user.organizationId,
      user.sub,
      expect.objectContaining({ startDate: '2026-09-01' }),
    );
  });

  it('deletes using the current company', async () => {
    await controller.remove(user, '55555555-5555-4555-8555-555555555555');

    expect(attendanceService.remove).toHaveBeenCalledWith(
      user.organizationId,
      '55555555-5555-4555-8555-555555555555',
    );
  });
});
