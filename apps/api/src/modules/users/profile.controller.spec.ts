import { BadRequestException } from '@nestjs/common';

import type { JwtPayload } from '../auth/types/jwt-payload.type';
import type { MediaService } from '../media/media.service';
import { ProfileController } from './profile.controller';
import type { ProfileService } from './profile.service';
import type { UserAvatarService } from './user-avatar.service';
import { UserSignatureService } from './user-signature.service';

describe('ProfileController', () => {
  const currentUser: JwtPayload = {
    sub: '11111111-1111-4111-8111-111111111111',
    organizationId: '22222222-2222-4222-8222-222222222222',
    email: 'employee@example.com',
    role: 'EMPLOYEE',
    tokenVersion: 0,
  };

  it('scopes signature uploads to the authenticated user and company', async () => {
    const userSignatureService = {
      uploadSignature: jest.fn().mockResolvedValue({ id: currentUser.sub }),
    };
    const controller = new ProfileController(
      {} as ProfileService,
      {} as UserAvatarService,
      userSignatureService as unknown as UserSignatureService,
    );
    const file = {
      mimetype: 'image/png',
      originalname: 'signature.png',
      size: 128,
      buffer: Buffer.from('signature'),
    } as Express.Multer.File;

    await controller.uploadSignature(currentUser, file);

    expect(userSignatureService.uploadSignature).toHaveBeenCalledWith(
      currentUser.organizationId,
      currentUser.sub,
      file,
    );
  });

  it('rejects non-PNG signature files before accessing storage', async () => {
    const service = new UserSignatureService({} as MediaService);
    const file = {
      mimetype: 'image/jpeg',
      originalname: 'signature.jpg',
      size: 128,
      buffer: Buffer.from('signature'),
    } as Express.Multer.File;

    await expect(
      service.uploadSignature(
        currentUser.organizationId,
        currentUser.sub,
        file,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
