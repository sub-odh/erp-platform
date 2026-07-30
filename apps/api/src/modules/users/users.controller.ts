import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER', 'ADMIN')
@Controller({
  path: 'users',
  version: '1',
})
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({
    summary: 'List users in the current organization',
  })
  @ApiOkResponse({
    type: UserResponseDto,
    isArray: true,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing, invalid, or expired token',
  })
  @ApiForbiddenResponse({
    description: 'Owner or administrator role required',
  })
  listUsers(
    @CurrentUser() currentUser: JwtPayload,
  ): Promise<UserResponseDto[]> {
    return this.usersService.listUsers(currentUser.organizationId);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a user in the current organization',
  })
  @ApiCreatedResponse({
    type: UserResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing, invalid, or expired token',
  })
  @ApiForbiddenResponse({
    description: 'Authenticated user cannot create the requested role',
  })
  @ApiConflictResponse({
    description: 'Email already exists in the organization',
  })
  createUser(
    @CurrentUser() currentUser: JwtPayload,
    @Body() createUserDto: CreateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.createUser(
      currentUser.organizationId,
      currentUser.role,
      createUserDto,
    );
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Activate or deactivate an organization user',
  })
  @ApiOkResponse({
    type: UserResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid user ID or request body',
  })
  @ApiUnauthorizedResponse({
    description: 'Missing, invalid, or expired token',
  })
  @ApiForbiddenResponse({
    description: 'The authenticated user cannot modify this account',
  })
  @ApiNotFoundResponse({
    description: 'User was not found in the organization',
  })
  updateUserStatus(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id', new ParseUUIDPipe()) userId: string,
    @Body() updateUserStatusDto: UpdateUserStatusDto,
  ): Promise<UserResponseDto> {
    return this.usersService.updateUserStatus(
      currentUser.organizationId,
      currentUser.sub,
      currentUser.role,
      userId,
      updateUserStatusDto.isActive,
    );
  }
}
