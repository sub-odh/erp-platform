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
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { JwtPayload } from './types/jwt-payload.type';
import { ApiForbiddenResponse } from '@nestjs/swagger';

import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';

@ApiTags('Authentication')
@Controller({
  path: 'auth',
  version: '1',
})
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('status')
  getStatus(): { status: string } {
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

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get the authenticated user profile',
  })
  @ApiOkResponse({
    schema: {
      example: {
        sub: '793079de-d814-4ee0-9074-b11fa60140e9',
        organizationId: '1970d947-0146-40bf-9320-b31938d2a5be',
        email: 'admin@mycompany.com',
        role: 'OWNER',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Missing, invalid, or expired token',
  })
  getProfile(@CurrentUser() user: JwtPayload): JwtPayload {
    return user;
  }
  @Get('admin-check')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Verify owner or administrator access',
  })
  @ApiOkResponse({
    schema: {
      example: {
        access: 'granted',
        role: 'OWNER',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Missing, invalid, or expired token',
  })
  @ApiForbiddenResponse({
    description: 'Authenticated user does not have an allowed role',
  })
  adminCheck(@CurrentUser() user: JwtPayload): {
    access: 'granted';
    role: JwtPayload['role'];
  } {
    return {
      access: 'granted',
      role: user.role,
    };
  }
}
