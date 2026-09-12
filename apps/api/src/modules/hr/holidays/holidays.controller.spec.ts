import type { JwtPayload } from '../../auth/types/jwt-payload.type';
import { HolidaysController } from './holidays.controller';
import type { HolidaysService } from './holidays.service';

describe('HolidaysController', () => {
  const user: JwtPayload = {
    sub: '11111111-1111-4111-8111-111111111111',
    organizationId: '22222222-2222-4222-8222-222222222222',
    email: 'hr@example.com',
    role: 'HR',
    tokenVersion: 0,
  };

  const holidaysService = {
    list: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const controller = new HolidaysController(
    holidaysService as unknown as HolidaysService,
  );

  beforeEach(() => jest.clearAllMocks());

  it('lists holidays for the authenticated tenant only', async () => {
    await controller.list(user);

    expect(holidaysService.list).toHaveBeenCalledWith(user.organizationId);
  });

  it('creates a holiday inside the authenticated company', async () => {
    await controller.create(user, {
      title: 'Dashain',
      holidayDate: '2026-10-12',
    });

    expect(holidaysService.create).toHaveBeenCalledWith(
      user.organizationId,
      user.sub,
      expect.objectContaining({ title: 'Dashain' }),
    );
  });

  it('deletes using the current company', async () => {
    await controller.remove(user, '33333333-3333-4333-8333-333333333333');

    expect(holidaysService.remove).toHaveBeenCalledWith(
      user.organizationId,
      '33333333-3333-4333-8333-333333333333',
    );
  });
});
