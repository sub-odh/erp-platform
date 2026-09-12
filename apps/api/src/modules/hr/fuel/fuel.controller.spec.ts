import type { JwtPayload } from '../../auth/types/jwt-payload.type';
import { FuelController } from './fuel.controller';
import type { FuelService } from './fuel.service';

describe('FuelController', () => {
  const user: JwtPayload = {
    sub: '11111111-1111-4111-8111-111111111111',
    organizationId: '22222222-2222-4222-8222-222222222222',
    email: 'hr@example.com',
    role: 'HR',
    tokenVersion: 0,
  };

  const fuelService = {
    list: jest.fn(),
    listMine: jest.fn(),
    getSettings: jest.fn(),
    updateSettings: jest.fn(),
    create: jest.fn(),
    approve: jest.fn(),
    reject: jest.fn(),
    reimburse: jest.fn(),
  };

  const controller = new FuelController(fuelService as unknown as FuelService);

  beforeEach(() => jest.clearAllMocks());

  it('lists fuel records for the authenticated tenant only', async () => {
    await controller.list(user);

    expect(fuelService.list).toHaveBeenCalledWith(user.organizationId);
  });

  it('lists the current employee fuel records only', async () => {
    await controller.listMine(user);

    expect(fuelService.listMine).toHaveBeenCalledWith(
      user.organizationId,
      user.sub,
    );
  });

  it('updates the fuel threshold for the authenticated company', async () => {
    await controller.updateSettings(user, { threshold: 275 });

    expect(fuelService.updateSettings).toHaveBeenCalledWith(
      user.organizationId,
      user.sub,
      { threshold: 275 },
    );
  });

  it('reimburses using the current company', async () => {
    await controller.reimburse(
      user,
      '33333333-3333-4333-8333-333333333333',
      { paymentReference: 'CHQ-100' },
    );

    expect(fuelService.reimburse).toHaveBeenCalledWith(
      user.organizationId,
      user.sub,
      '33333333-3333-4333-8333-333333333333',
      { paymentReference: 'CHQ-100' },
    );
  });
});
