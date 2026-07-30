import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { env } from '@erp/config';

import { UsersService } from '../../users/users.service';
import type { JwtPayload } from '../types/jwt-payload.type';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: env.JWT_ACCESS_SECRET,
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    const user = await this.usersService.findByIdAndOrganization(
      payload.sub,
      payload.organizationId,
    );

    if (!user || !user.isActive) {
      throw new UnauthorizedException();
    }

    return {
      sub: user.id,
      organizationId: user.organizationId,
      email: user.email,
      role: user.role,
    };
  }
}
