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

import { CurrentUser } from './decorators/current-user.decorator';
import { Roles } from './decorators/roles.decorator';
import { AuthService } from './auth.service';
import { LoginResponseDto } from './dto/login-response.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import type { JwtPayload } from './types/jwt-payload.type';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  @ApiOperation({
    summary: 'Check authentication module status',
  })
  @ApiOkResponse({
    description: 'Authentication module is available',
  })
  getStatus(): { status: string } {
    return this.authService.getStatus();
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Authenticate a user',
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
  refresh(@Body() refreshTokenDto: RefreshTokenDto): Promise<LoginResponseDto> {
    return this.authService.refresh(refreshTokenDto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Revoke the current refresh-token session',
  })
  @ApiNoContentResponse({
    description: 'Session revoked successfully',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid, expired, revoked, or reused refresh token',
  })
  logout(@Body() refreshTokenDto: RefreshTokenDto): Promise<void> {
    return this.authService.logout(refreshTokenDto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Return the authenticated user payload',
  })
  @ApiOkResponse({
    description: 'Authenticated JWT payload',
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid access token',
  })
  getProfile(@CurrentUser() currentUser: JwtPayload): JwtPayload {
    return currentUser;
  }

  @Get('admin-check')
  @Roles('OWNER', 'ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Verify OWNER or ADMIN authorization',
  })
  @ApiOkResponse({
    description: 'User has administrative access',
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid access token',
  })
  adminCheck(@CurrentUser() currentUser: JwtPayload): {
    message: string;
    user: JwtPayload;
  } {
    return {
      message: 'Administrative access granted',
      user: currentUser,
    };
  }
}
