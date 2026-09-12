import type { JwtPayload } from '../../auth/types/jwt-payload.type';
import { EmployeesController } from './employees.controller';
import type { EmployeesService } from './employees.service';

describe('EmployeesController', () => {
  const user: JwtPayload = {
    sub: '11111111-1111-4111-8111-111111111111',
    organizationId: '22222222-2222-4222-8222-222222222222',
    email: 'hr@example.com',
    role: 'HR',
    tokenVersion: 0,
  };

  const employeesService = {
    list: jest.fn(),
    lookups: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    deactivate: jest.fn(),
    restore: jest.fn(),
  };

  const controller = new EmployeesController(
    employeesService as unknown as EmployeesService,
  );

  beforeEach(() => jest.clearAllMocks());

  it('lists employees for the authenticated tenant only', async () => {
    await controller.list(user, {
      status: 'all',
      department: 'Information Technology',
      designation: 'Presales Manager',
      page: 1,
      limit: 20,
      sortBy: 'firstName',
      sortDirection: 'asc',
    });

    expect(employeesService.list).toHaveBeenCalledWith(user.organizationId, {
      status: 'all',
      department: 'Information Technology',
      designation: 'Presales Manager',
      page: 1,
      limit: 20,
      sortBy: 'firstName',
      sortDirection: 'asc',
    });
  });

  it('keeps employee lookups inside the authenticated company', async () => {
    await controller.lookups(user);

    expect(employeesService.lookups).toHaveBeenCalledWith(
      user.organizationId,
      undefined,
    );
  });

  it('creates an employee inside the authenticated company', async () => {
    await controller.create(user, {
      employeeCode: '007',
      firstName: 'Ujwal',
      lastName: 'Shakya',
    });

    expect(employeesService.create).toHaveBeenCalledWith(
      user.organizationId,
      user.sub,
      expect.objectContaining({ employeeCode: '007' }),
    );
  });

  it('deactivates using the current company and actor', async () => {
    await controller.deactivate(user, '33333333-3333-4333-8333-333333333333');

    expect(employeesService.deactivate).toHaveBeenCalledWith(
      user.organizationId,
      user.sub,
      '33333333-3333-4333-8333-333333333333',
    );
  });
});
