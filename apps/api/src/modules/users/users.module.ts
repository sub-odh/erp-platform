import { Module } from '@nestjs/common';

import { UserPasswordResetService } from './user-password-reset.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, UserPasswordResetService],
  exports: [UsersService],
})
export class UsersModule {}
