import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { env } from '@erp/config';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [
    JwtModule.register({
      secret: env.JWT_ACCESS_SECRET,
      signOptions: {
        expiresIn: env.JWT_ACCESS_TTL_SECONDS,
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
