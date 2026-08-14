import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { compare } from 'bcrypt';

import type { User } from '@erp/db';

import { OwnerVerificationService } from './owner-verification.service';
import type { UsersService } from './users.service';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

describe('OwnerVerificationService', () => {
  const organizationId = '22222222-2222-4222-8222-222222222222';
  const actorUserId = '11111111-1111-4111-8111-111111111111';
  const usersService = {
    findByIdAndOrganization: jest.fn(),
  };
  const service = new OwnerVerificationService(
    usersService as unknown as UsersService,
  );
  const owner = {
    id: actorUserId,
    organizationId,
    role: 'OWNER',
    isActive: true,
    passwordHash: 'stored-password-hash',
  } as User;

  beforeEach(() => jest.clearAllMocks());

  it('rejects an authenticated account that is not the company owner', async () => {
    usersService.findByIdAndOrganization.mockResolvedValue({
      ...owner,
      role: 'SUPER_ADMIN',
    });

    await expect(
      service.assertPassword(organizationId, actorUserId, 'password'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(compare).not.toHaveBeenCalled();
  });

  it('rejects an incorrect owner password', async () => {
    usersService.findByIdAndOrganization.mockResolvedValue(owner);
    jest.mocked(compare).mockResolvedValue(false as never);

    await expect(
      service.assertPassword(organizationId, actorUserId, 'wrong-password'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('accepts the current password of the active company owner', async () => {
    usersService.findByIdAndOrganization.mockResolvedValue(owner);
    jest.mocked(compare).mockResolvedValue(true as never);

    await expect(
      service.assertPassword(organizationId, actorUserId, 'owner-password'),
    ).resolves.toBeUndefined();
    expect(compare).toHaveBeenCalledWith('owner-password', owner.passwordHash);
  });
});
