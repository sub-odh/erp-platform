import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Roles } from './decorators/roles.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import type { JwtPayload } from './types/jwt-payload.type';

@ApiTags('Authentication')
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
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Log in to an organization',
  })
  @ApiOkResponse({
    type: LoginResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials',
  })
  login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
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
  refresh(
    @Body()
    refreshTokenDto: RefreshTokenDto,
  ): Promise<LoginResponseDto> {
    return this.authService.refresh(refreshTokenDto);
  }

  @Post('logout')
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
  logout(
    @Body()
    refreshTokenDto: RefreshTokenDto,
  ): Promise<void> {
    return this.authService.logout(refreshTokenDto);
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
  changePassword(
    @CurrentUser()
    currentUser: JwtPayload,
    @Body()
    changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    return this.authService.changePassword(currentUser, changePasswordDto);
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
  logoutAll(
    @CurrentUser()
    currentUser: JwtPayload,
  ): Promise<void> {
    return this.authService.logoutAll(currentUser);
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
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
