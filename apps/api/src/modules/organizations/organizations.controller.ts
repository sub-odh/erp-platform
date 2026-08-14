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
  ApiForbiddenResponse,
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
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { PERMISSIONS } from '../auth/permissions/permission.constants';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { MEDIA_MAX_FILE_SIZE } from '../media/constants';
import { OrganizationResponseDto } from './dto/organization-response.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { OrganizationsService } from './organizations.service';

@ApiTags('Organizations')
@ApiBearerAuth()
@AuditEntity('platform.organization')
@Controller({
  path: 'organizations',
  version: '1',
})
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get('current')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get the authenticated user organization',
  })
  @ApiOkResponse({
    type: OrganizationResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing, invalid, or expired access token',
  })
  @ApiNotFoundResponse({
    description: 'Organization was not found',
  })
  getCurrent(
    @CurrentUser()
    currentUser: JwtPayload,
  ): Promise<OrganizationResponseDto> {
    return this.organizationsService.findCurrent(currentUser.organizationId);
  }

  @Patch('current')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSIONS.ORGANIZATION_MANAGE)
  @ApiOperation({
    summary: 'Update the authenticated user organization',
  })
  @ApiOkResponse({
    type: OrganizationResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing, invalid, or expired access token',
  })
  @ApiForbiddenResponse({
    description: 'Owner or administrator role required',
  })
  @ApiNotFoundResponse({
    description: 'Organization was not found',
  })
  updateCurrent(
    @CurrentUser()
    currentUser: JwtPayload,
    @Body()
    updateOrganizationDto: UpdateOrganizationDto,
  ): Promise<OrganizationResponseDto> {
    return this.organizationsService.updateCurrent(
      currentUser.organizationId,
      updateOrganizationDto,
    );
  }

  @Post('current/logo')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSIONS.ORGANIZATION_MANAGE)
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
    summary: 'Upload the current organization logo',
  })
  @ApiOkResponse({
    type: OrganizationResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Missing, invalid, or oversized image',
  })
  @ApiUnauthorizedResponse({
    description: 'Missing, invalid, or expired access token',
  })
  @ApiForbiddenResponse({
    description: 'Owner or administrator role required',
  })
  uploadLogo(
    @CurrentUser()
    currentUser: JwtPayload,
    @UploadedFile()
    file: Express.Multer.File | undefined,
  ): Promise<OrganizationResponseDto> {
    return this.organizationsService.uploadLogo(
      currentUser.organizationId,
      file,
    );
  }

  @Delete('current/logo')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSIONS.ORGANIZATION_MANAGE)
  @ApiOperation({
    summary: 'Remove the current organization logo',
  })
  @ApiOkResponse({
    type: OrganizationResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing, invalid, or expired access token',
  })
  @ApiForbiddenResponse({
    description: 'Owner or administrator role required',
  })
  @ApiNotFoundResponse({
    description: 'Organization was not found',
  })
  removeLogo(
    @CurrentUser()
    currentUser: JwtPayload,
  ): Promise<OrganizationResponseDto> {
    return this.organizationsService.removeLogo(currentUser.organizationId);
  }
}
