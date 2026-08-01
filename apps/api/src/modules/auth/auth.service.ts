import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcrypt';
import { createHash, randomUUID } from 'node:crypto';

import { env } from '@erp/config';
import type { User } from '@erp/db';

import { UsersService } from '../users/users.service';
import { AuthSessionsService } from './auth-sessions.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import type { JwtPayload } from './types/jwt-payload.type';
import type { RefreshTokenPayload } from './types/refresh-token-payload.type';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly authSessionsService: AuthSessionsService,
  ) {}

  getStatus(): { status: string } {
    return {
      status: 'Authentication module is ready',
    };
  }

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const user = await this.usersService.findByOrganizationAndEmail(
      loginDto.organizationCode,
      loginDto.email,
    );

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await compare(loginDto.password, user.passwordHash);

    if (!passwordMatches || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const sessionId = randomUUID();

    const accessToken = await this.createAccessToken(user);

    const refreshToken = await this.createRefreshToken(user, sessionId);

    await this.authSessionsService.createSession({
      id: sessionId,
      userId: user.id,
      refreshTokenHash: this.hashRefreshToken(refreshToken),
      expiresAt: this.getRefreshExpiration(),
    });

    await this.usersService.updateLastLogin(user.id);

    return this.createAuthResponse(user, accessToken, refreshToken);
  }

  async refresh(refreshTokenDto: RefreshTokenDto): Promise<LoginResponseDto> {
    const currentRefreshToken = refreshTokenDto.refreshToken;

    const payload = await this.verifyRefreshToken(currentRefreshToken);

    const user = await this.usersService.findByIdAndOrganization(
      payload.sub,
      payload.organizationId,
    );

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const nextAccessToken = await this.createAccessToken(user);

    const nextRefreshToken = await this.createRefreshToken(
      user,
      payload.sessionId,
    );

    const wasRotated = await this.authSessionsService.rotateSession({
      sessionId: payload.sessionId,
      userId: user.id,
      currentTokenHash: this.hashRefreshToken(currentRefreshToken),
      nextTokenHash: this.hashRefreshToken(nextRefreshToken),
      nextExpiresAt: this.getRefreshExpiration(),
    });

    if (!wasRotated) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return this.createAuthResponse(user, nextAccessToken, nextRefreshToken);
  }

  async logout(refreshTokenDto: RefreshTokenDto): Promise<void> {
    const refreshToken = refreshTokenDto.refreshToken;

    const payload = await this.verifyRefreshToken(refreshToken, true);

    const wasRevoked = await this.authSessionsService.revokeSession({
      sessionId: payload.sessionId,
      userId: payload.sub,
      refreshTokenHash: this.hashRefreshToken(refreshToken),
    });

    if (!wasRevoked) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async changePassword(
    currentUser: JwtPayload,
    changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    const user = await this.usersService.findByIdAndOrganization(
      currentUser.sub,
      currentUser.organizationId,
    );

    if (!user || !user.isActive) {
      throw new UnauthorizedException();
    }

    const currentPasswordMatches = await compare(
      changePasswordDto.currentPassword,
      user.passwordHash,
    );

    if (!currentPasswordMatches) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const passwordIsUnchanged = await compare(
      changePasswordDto.newPassword,
      user.passwordHash,
    );

    if (passwordIsUnchanged) {
      throw new UnauthorizedException(
        'New password must be different from the current password',
      );
    }

    const newPasswordHash = await hash(changePasswordDto.newPassword, 12);

    const wasUpdated = await this.usersService.updatePassword(
      user.id,
      user.organizationId,
      newPasswordHash,
    );

    if (!wasUpdated) {
      throw new UnauthorizedException();
    }

    await this.authSessionsService.revokeAllSessions(user.id);
  }

  async logoutAll(currentUser: JwtPayload): Promise<void> {
    const user = await this.usersService.findByIdAndOrganization(
      currentUser.sub,
      currentUser.organizationId,
    );

    if (!user || !user.isActive) {
      throw new UnauthorizedException();
    }

    const wasUpdated = await this.usersService.incrementTokenVersion(
      user.id,
      user.organizationId,
    );

    if (!wasUpdated) {
      throw new UnauthorizedException();
    }

    await this.authSessionsService.revokeAllSessions(user.id);
  }

  private async createAccessToken(user: User): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      organizationId: user.organizationId,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
    };

    return this.jwtService.signAsync(payload, {
      secret: env.JWT_ACCESS_SECRET,
      expiresIn: env.JWT_ACCESS_TTL_SECONDS,
    });
  }

  private async createRefreshToken(
    user: User,
    sessionId: string,
  ): Promise<string> {
    const payload: RefreshTokenPayload = {
      sub: user.id,
      organizationId: user.organizationId,
      sessionId,
      tokenType: 'refresh',
      jti: randomUUID(),
    };

    return this.jwtService.signAsync(payload, {
      secret: env.JWT_REFRESH_SECRET,
      expiresIn: env.JWT_REFRESH_TTL_SECONDS,
    });
  }

  private async verifyRefreshToken(
    token: string,
    ignoreExpiration = false,
  ): Promise<RefreshTokenPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(
        token,
        {
          secret: env.JWT_REFRESH_SECRET,
          ignoreExpiration,
        },
      );

      if (payload.tokenType !== 'refresh') {
        throw new Error('Invalid token type');
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private getRefreshExpiration(): Date {
    return new Date(Date.now() + env.JWT_REFRESH_TTL_SECONDS * 1000);
  }

  private createAuthResponse(
    user: User,
    accessToken: string,
    refreshToken: string,
  ): LoginResponseDto {
    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: env.JWT_ACCESS_TTL_SECONDS,
      refreshExpiresIn: env.JWT_REFRESH_TTL_SECONDS,
      user: {
        id: user.id,
        organizationId: user.organizationId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }
}
