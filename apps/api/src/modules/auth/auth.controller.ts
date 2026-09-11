import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { Request, Response } from 'express';

import { AuditEntity } from '../../common/audit/audit.decorator';

import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { RequirePermissions } from './decorators/permissions.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { PERMISSIONS } from './permissions/permission.constants';
import {
  clearRefreshTokenCookie,
  readRefreshTokenCookie,
  setRefreshTokenCookie,
} from './refresh-token-cookie';
import type { JwtPayload } from './types/jwt-payload.type';

@ApiTags('Authentication')
@AuditEntity('platform.authentication')
@Controller({
  path: 'auth',
  version: '1',
})
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('status')
  @ApiOperation({
    summary: 'Check authentication status',
  })
  getStatus(): {
    status: string;
  } {
    return this.authService.getStatus();
  }

  @Post('login')
  @UseGuards(ThrottlerGuard)
  @Throttle({ auth: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Log in to a company',
  })
  @ApiOkResponse({
    type: LoginResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials',
  })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<LoginResponseDto> {
    const result = await this.authService.login(loginDto);

    setRefreshTokenCookie(response, result.refreshToken);

    return result.response;
  }

  @Post('refresh')
  @UseGuards(ThrottlerGuard)
  @Throttle({ auth: { limit: 10, ttl: 60_000 } })
  @ApiCookieAuth('erp_refresh_token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Rotate a refresh token',
  })
  @ApiOkResponse({
    type: LoginResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid, expired, revoked, or reused refresh token',
  })
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<LoginResponseDto> {
    try {
      const result = await this.authService.refresh(
        readRefreshTokenCookie(request),
      );

      setRefreshTokenCookie(response, result.refreshToken);

      return result.response;
    } catch (error: unknown) {
      clearRefreshTokenCookie(response);
      throw error;
    }
  }

  @Post('logout')
  @UseGuards(ThrottlerGuard)
  @Throttle({ auth: { limit: 10, ttl: 60_000 } })
  @ApiCookieAuth('erp_refresh_token')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Revoke one refresh-token session',
  })
  @ApiNoContentResponse({
    description: 'Session revoked successfully',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid refresh token',
  })
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    try {
      await this.authService.logout(readRefreshTokenCookie(request));
    } finally {
      clearRefreshTokenCookie(response);
    }
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Change the current password and revoke all sessions',
  })
  @ApiNoContentResponse({
    description: 'Password changed and all sessions revoked',
  })
  @ApiUnauthorizedResponse({
    description: 'Missing access token or incorrect current password',
  })
  async changePassword(
    @CurrentUser()
    currentUser: JwtPayload,
    @Body()
    changePasswordDto: ChangePasswordDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.authService.changePassword(currentUser, changePasswordDto);
    clearRefreshTokenCookie(response);
  }

  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Invalidate every access token and refresh session',
  })
  @ApiNoContentResponse({
    description: 'All sessions revoked successfully',
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid access token',
  })
  async logoutAll(
    @CurrentUser()
    currentUser: JwtPayload,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.authService.logoutAll(currentUser);
    clearRefreshTokenCookie(response);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get the authenticated user',
  })
  @ApiOkResponse({
    description: 'Authenticated user payload',
  })
  getProfile(
    @CurrentUser()
    currentUser: JwtPayload,
  ): JwtPayload {
    return currentUser;
  }

  @Get('admin-check')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSIONS.USERS_MANAGE)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Verify owner or administrator access',
  })
  adminCheck(
    @CurrentUser()
    currentUser: JwtPayload,
  ): {
    access: 'granted';
    role: JwtPayload['role'];
  } {
    return {
      access: 'granted',
      role: currentUser.role,
    };
  }
}
