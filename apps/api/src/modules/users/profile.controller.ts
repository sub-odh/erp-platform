import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

import { AuditEntity } from '../../common/audit/audit.decorator';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { MEDIA_MAX_FILE_SIZE } from '../media/constants';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { ProfileService } from './profile.service';
import { UserAvatarService } from './user-avatar.service';
import { UserSignatureService } from './user-signature.service';

@ApiTags('Profile')
@ApiBearerAuth()
@AuditEntity('platform.profile')
@UseGuards(JwtAuthGuard)
@Controller({
  path: 'profile',
  version: '1',
})
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,

    private readonly userAvatarService: UserAvatarService,

    private readonly userSignatureService: UserSignatureService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get the authenticated user profile',
  })
  @ApiOkResponse({
    type: UserResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing, invalid, or expired access token',
  })
  @ApiNotFoundResponse({
    description: 'User profile was not found',
  })
  getProfile(
    @CurrentUser()
    currentUser: JwtPayload,
  ): Promise<UserResponseDto> {
    return this.profileService.getProfile(
      currentUser.sub,
      currentUser.organizationId,
    );
  }

  @Patch()
  @ApiOperation({
    summary: 'Update the authenticated user profile',
  })
  @ApiOkResponse({
    type: UserResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid profile data',
  })
  @ApiUnauthorizedResponse({
    description: 'Missing, invalid, or expired access token',
  })
  @ApiNotFoundResponse({
    description: 'User profile was not found',
  })
  updateProfile(
    @CurrentUser()
    currentUser: JwtPayload,

    @Body()
    updateProfileDto: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    return this.profileService.updateProfile(
      currentUser.sub,
      currentUser.organizationId,
      updateProfileDto,
    );
  }

  @Post('avatar')
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
    summary: 'Upload or replace the authenticated user profile picture',
  })
  @ApiOkResponse({
    type: UserResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Missing, invalid, or oversized image',
  })
  @ApiUnauthorizedResponse({
    description: 'Missing, invalid, or expired access token',
  })
  uploadAvatar(
    @CurrentUser()
    currentUser: JwtPayload,

    @UploadedFile()
    file: Express.Multer.File | undefined,
  ): Promise<UserResponseDto> {
    return this.userAvatarService.uploadAvatar(
      currentUser.organizationId,
      currentUser.sub,
      currentUser.role,
      currentUser.sub,
      file,
    );
  }

  @Delete('avatar')
  @ApiOperation({
    summary: 'Remove the authenticated user profile picture',
  })
  @ApiOkResponse({
    type: UserResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing, invalid, or expired access token',
  })
  @ApiNotFoundResponse({
    description: 'User profile was not found',
  })
  removeAvatar(
    @CurrentUser()
    currentUser: JwtPayload,
  ): Promise<UserResponseDto> {
    return this.userAvatarService.removeAvatar(
      currentUser.organizationId,
      currentUser.sub,
      currentUser.role,
      currentUser.sub,
    );
  }

  @Post('signature')
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
    summary: 'Upload or replace the authenticated user signature',
  })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiBadRequestResponse({
    description: 'A PNG signature image is required',
  })
  uploadSignature(
    @CurrentUser()
    currentUser: JwtPayload,

    @UploadedFile()
    file: Express.Multer.File | undefined,
  ): Promise<UserResponseDto> {
    return this.userSignatureService.uploadSignature(
      currentUser.organizationId,
      currentUser.sub,
      file,
    );
  }

  @Delete('signature')
  @ApiOperation({
    summary: 'Remove the authenticated user signature',
  })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiUnauthorizedResponse({
    description: 'Missing, invalid, or expired access token',
  })
  @ApiNotFoundResponse({
    description: 'User profile was not found',
  })
  removeSignature(
    @CurrentUser()
    currentUser: JwtPayload,
  ): Promise<UserResponseDto> {
    return this.userSignatureService.removeSignature(
      currentUser.organizationId,
      currentUser.sub,
    );
  }
}
