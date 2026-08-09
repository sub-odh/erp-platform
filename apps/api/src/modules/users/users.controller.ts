import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiConsumes,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { MEDIA_MAX_FILE_SIZE } from '../media/constants';
import { CreateUserDto } from './dto/create-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { ResetUserPasswordResponseDto } from './dto/reset-user-password-response.dto';
import {
  PaginatedUsersResponseDto,
  UserResponseDto,
} from './dto/user-response.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UserAvatarService } from './user-avatar.service';
import { UserPasswordResetService } from './user-password-reset.service';
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
  constructor(
    private readonly usersService: UsersService,
    private readonly userPasswordResetService: UserPasswordResetService,
    private readonly userAvatarService: UserAvatarService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List users in the current organization',
  })
  @ApiOkResponse({
    type: PaginatedUsersResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid list query parameters',
  })
  @ApiUnauthorizedResponse({
    description: 'Missing, invalid, or expired token',
  })
  @ApiForbiddenResponse({
    description: 'Owner or administrator role required',
  })
  listUsers(
    @CurrentUser()
    currentUser: JwtPayload,
    @Query()
    query: ListUsersQueryDto,
  ): Promise<PaginatedUsersResponseDto> {
    return this.usersService.listUsers(currentUser.organizationId, query);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a user in the current organization',
  })
  @ApiCreatedResponse({
    type: UserResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid request body',
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
    @CurrentUser()
    currentUser: JwtPayload,
    @Body()
    createUserDto: CreateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.createUser(
      currentUser.organizationId,
      currentUser.role,
      createUserDto,
    );
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update an organization user',
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
  updateUser(
    @CurrentUser()
    currentUser: JwtPayload,
    @Param('id', new ParseUUIDPipe())
    userId: string,
    @Body()
    updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.updateUser(
      currentUser.organizationId,
      currentUser.sub,
      currentUser.role,
      userId,
      updateUserDto,
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
    @CurrentUser()
    currentUser: JwtPayload,
    @Param('id', new ParseUUIDPipe())
    userId: string,
    @Body()
    updateUserStatusDto: UpdateUserStatusDto,
  ): Promise<UserResponseDto> {
    return this.usersService.updateUserStatus(
      currentUser.organizationId,
      currentUser.sub,
      currentUser.role,
      userId,
      updateUserStatusDto.isActive,
    );
  }

  @Post(':id/avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: MEDIA_MAX_FILE_SIZE,
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiOperation({
    summary: 'Upload or replace an organization user avatar',
  })
  @ApiOkResponse({
    type: UserResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Missing, invalid, or oversized image',
  })
  @ApiUnauthorizedResponse({
    description: 'Missing, invalid, or expired token',
  })
  @ApiForbiddenResponse({
    description: 'The authenticated user cannot modify this avatar',
  })
  @ApiNotFoundResponse({
    description: 'User was not found in the organization',
  })
  uploadAvatar(
    @CurrentUser()
    currentUser: JwtPayload,
    @Param('id', new ParseUUIDPipe())
    userId: string,
    @UploadedFile()
    file: Express.Multer.File | undefined,
  ): Promise<UserResponseDto> {
    return this.userAvatarService.uploadAvatar(
      currentUser.organizationId,
      currentUser.sub,
      currentUser.role,
      userId,
      file,
    );
  }

  @Delete(':id/avatar')
  @ApiOperation({
    summary: 'Remove an organization user avatar',
  })
  @ApiOkResponse({
    type: UserResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid user ID',
  })
  @ApiUnauthorizedResponse({
    description: 'Missing, invalid, or expired token',
  })
  @ApiForbiddenResponse({
    description: 'The authenticated user cannot modify this avatar',
  })
  @ApiNotFoundResponse({
    description: 'User was not found in the organization',
  })
  removeAvatar(
    @CurrentUser()
    currentUser: JwtPayload,
    @Param('id', new ParseUUIDPipe())
    userId: string,
  ): Promise<UserResponseDto> {
    return this.userAvatarService.removeAvatar(
      currentUser.organizationId,
      currentUser.sub,
      currentUser.role,
      userId,
    );
  }

  @Post(':id/reset-password')
  @ApiOperation({
    summary: 'Generate a temporary password for an organization user',
  })
  @ApiOkResponse({
    type: ResetUserPasswordResponseDto,
    description:
      'Password reset successfully. The temporary password is returned once.',
  })
  @ApiBadRequestResponse({
    description: 'Invalid user ID',
  })
  @ApiUnauthorizedResponse({
    description: 'Missing, invalid, or expired token',
  })
  @ApiForbiddenResponse({
    description: 'The authenticated user cannot reset this account password',
  })
  @ApiNotFoundResponse({
    description: 'User was not found in the organization',
  })
  resetPassword(
    @CurrentUser()
    currentUser: JwtPayload,
    @Param('id', new ParseUUIDPipe())
    userId: string,
  ): Promise<ResetUserPasswordResponseDto> {
    return this.userPasswordResetService.resetPassword(
      currentUser.organizationId,
      currentUser.sub,
      currentUser.role,
      userId,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Archive an organization user',
  })
  @ApiNoContentResponse({
    description: 'User archived successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid user ID',
  })
  @ApiUnauthorizedResponse({
    description: 'Missing, invalid, or expired token',
  })
  @ApiForbiddenResponse({
    description: 'The authenticated user cannot archive this account',
  })
  @ApiNotFoundResponse({
    description: 'User was not found in the organization',
  })
  archiveUser(
    @CurrentUser()
    currentUser: JwtPayload,
    @Param('id', new ParseUUIDPipe())
    userId: string,
  ): Promise<void> {
    return this.usersService.archiveUser(
      currentUser.organizationId,
      currentUser.sub,
      currentUser.role,
      userId,
    );
  }

  @Post(':id/restore')
  @ApiOperation({
    summary: 'Restore an archived organization user as inactive',
  })
  @ApiOkResponse({
    type: UserResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid user ID',
  })
  @ApiUnauthorizedResponse({
    description: 'Missing, invalid, or expired token',
  })
  @ApiForbiddenResponse({
    description: 'The authenticated user cannot restore this account',
  })
  @ApiNotFoundResponse({
    description: 'User was not found in the organization',
  })
  @ApiConflictResponse({
    description: 'User is not archived',
  })
  restoreUser(
    @CurrentUser()
    currentUser: JwtPayload,
    @Param('id', new ParseUUIDPipe())
    userId: string,
  ): Promise<UserResponseDto> {
    return this.usersService.restoreUser(
      currentUser.organizationId,
      currentUser.role,
      userId,
    );
  }
}
