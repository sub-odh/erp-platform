import { Module } from '@nestjs/common';

import { MediaModule } from '../media/media.module';
import { OwnerVerificationService } from './owner-verification.service';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { UserAvatarService } from './user-avatar.service';
import { UserPasswordResetService } from './user-password-reset.service';
import { UserSignatureService } from './user-signature.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [MediaModule],

  controllers: [UsersController, ProfileController],

  providers: [
    UsersService,
    UserPasswordResetService,
    UserAvatarService,
    ProfileService,
    UserSignatureService,
    OwnerVerificationService,
  ],

  exports: [UsersService, OwnerVerificationService],
})
export class UsersModule {}
