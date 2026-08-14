import { ForbiddenException } from '@nestjs/common';

import type { LicensingService } from '../../common/licensing/licensing.service';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import type { MediaService } from '../media/media.service';
import type { NotificationsService } from '../notifications/notifications.service';
import type { UserAvatarService } from './user-avatar.service';
import type { UserPasswordResetService } from './user-password-reset.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('Permanent user deletion', () => {
  const organizationId = '22222222-2222-4222-8222-222222222222';
  const ownerId = '11111111-1111-4111-8111-111111111111';
  const targetUserId = '33333333-3333-4333-8333-333333333333';
  const service = new UsersService(
    {} as LicensingService,
    {} as NotificationsService,
    {} as MediaService,
  );

  it('rejects permanent deletion by a non-owner before accessing the target', async () => {
    await expect(
      service.permanentlyDeleteUser(
        organizationId,
        ownerId,
        'SUPER_ADMIN',
        targetUserId,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('prevents the owner from permanently deleting their own account', async () => {
    await expect(
      service.permanentlyDeleteUser(organizationId, ownerId, 'OWNER', ownerId),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('passes authenticated company and owner identity to the service', async () => {
    const usersService = {
      permanentlyDeleteUser: jest.fn().mockResolvedValue(undefined),
    };
    const controller = new UsersController(
      usersService as unknown as UsersService,
      {} as UserPasswordResetService,
      {} as UserAvatarService,
    );
    const owner: JwtPayload = {
      sub: ownerId,
      organizationId,
      email: 'owner@example.com',
      role: 'OWNER',
      tokenVersion: 0,
    };

    await controller.permanentlyDeleteUser(owner, targetUserId);

    expect(usersService.permanentlyDeleteUser).toHaveBeenCalledWith(
      organizationId,
      ownerId,
      'OWNER',
      targetUserId,
    );
  });
});
