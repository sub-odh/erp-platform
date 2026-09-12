import type { JwtPayload } from '../../auth/types/jwt-payload.type';
import { ExpensesController } from './expenses.controller';
import type { ExpensesService } from './expenses.service';

describe('ExpensesController', () => {
  const user: JwtPayload = {
    sub: '11111111-1111-4111-8111-111111111111',
    organizationId: '22222222-2222-4222-8222-222222222222',
    email: 'hr@example.com',
    role: 'HR',
    tokenVersion: 0,
  };

  const expensesService = {
    list: jest.fn(),
    listMine: jest.fn(),
    create: jest.fn(),
    approve: jest.fn(),
    reject: jest.fn(),
  };

  const controller = new ExpensesController(
    expensesService as unknown as ExpensesService,
  );

  beforeEach(() => jest.clearAllMocks());

  it('lists TADA expenses for the authenticated tenant only', async () => {
    await controller.list(user);

    expect(expensesService.list).toHaveBeenCalledWith(user.organizationId);
  });

  it('lists the current employee TADA records only', async () => {
    await controller.listMine(user);

    expect(expensesService.listMine).toHaveBeenCalledWith(
      user.organizationId,
      user.sub,
    );
  });

  it('creates a TADA request for the authenticated employee', async () => {
    await controller.create(user, {
      travelDate: '2026-09-12',
      origin: 'Kathmandu',
      destination: 'Pokhara',
      amount: 1500,
      purpose: 'Field visit',
    });

    expect(expensesService.create).toHaveBeenCalledWith(
      user.organizationId,
      user.sub,
      expect.objectContaining({ travelDate: '2026-09-12', amount: 1500 }),
    );
  });

  it('approves using the current company', async () => {
    await controller.approve(
      user,
      '33333333-3333-4333-8333-333333333333',
      { remarks: 'Approved' },
    );

    expect(expensesService.approve).toHaveBeenCalledWith(
      user.organizationId,
      user.sub,
      '33333333-3333-4333-8333-333333333333',
      { remarks: 'Approved' },
    );
  });
});
