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
import { CompanyDataService } from './company-data.service';
import { CompanyService } from './company.service';
import { CompanyResponseDto } from './dto/company-response.dto';
import { ResetCompanyDataDto } from './dto/reset-company-data.dto';
import { RestoreCompanyDataDto } from './dto/restore-company-data.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

const COMPANY_BACKUP_MAX_FILE_SIZE = 20 * 1024 * 1024;

@ApiTags('Company')
@ApiBearerAuth()
@AuditEntity('platform.company')
@Controller({
  path: ['company', 'organizations'],
  version: '1',
})
export class CompanyController {
  constructor(
    private readonly companyService: CompanyService,
    private readonly companyDataService: CompanyDataService,
  ) {}

  @Get('current')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get the authenticated user company',
  })
  @ApiOkResponse({
    type: CompanyResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing, invalid, or expired access token',
  })
  @ApiNotFoundResponse({
    description: 'Company was not found',
  })
  getCurrent(
    @CurrentUser()
    currentUser: JwtPayload,
  ): Promise<CompanyResponseDto> {
    return this.companyService.findCurrent(currentUser.organizationId);
  }

  @Patch('current')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSIONS.ORGANIZATION_MANAGE)
  @ApiOperation({
    summary: 'Update the authenticated user company',
  })
  @ApiOkResponse({
    type: CompanyResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing, invalid, or expired access token',
  })
  @ApiForbiddenResponse({
    description: 'Owner or administrator role required',
  })
  @ApiNotFoundResponse({
    description: 'Company was not found',
  })
  updateCurrent(
    @CurrentUser()
    currentUser: JwtPayload,
    @Body()
    updateCompanyDto: UpdateCompanyDto,
  ): Promise<CompanyResponseDto> {
    return this.companyService.updateCurrent(
      currentUser.organizationId,
      updateCompanyDto,
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
    summary: 'Upload the current company logo',
  })
  @ApiOkResponse({
    type: CompanyResponseDto,
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
  ): Promise<CompanyResponseDto> {
    return this.companyService.uploadLogo(currentUser.organizationId, file);
  }

  @Delete('current/logo')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSIONS.ORGANIZATION_MANAGE)
  @ApiOperation({
    summary: 'Remove the current company logo',
  })
  @ApiOkResponse({
    type: CompanyResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing, invalid, or expired access token',
  })
  @ApiForbiddenResponse({
    description: 'Owner or administrator role required',
  })
  @ApiNotFoundResponse({
    description: 'Company was not found',
  })
  removeLogo(
    @CurrentUser()
    currentUser: JwtPayload,
  ): Promise<CompanyResponseDto> {
    return this.companyService.removeLogo(currentUser.organizationId);
  }

  @Post('current/invoice-logo')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSIONS.ORGANIZATION_MANAGE)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MEDIA_MAX_FILE_SIZE },
    }),
  )
  @ApiConsumes('multipart/form-data')
  uploadInvoiceLogo(
    @CurrentUser() currentUser: JwtPayload,
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<CompanyResponseDto> {
    return this.companyService.uploadInvoiceLogo(
      currentUser.organizationId,
      file,
    );
  }

  @Delete('current/invoice-logo')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSIONS.ORGANIZATION_MANAGE)
  removeInvoiceLogo(
    @CurrentUser() currentUser: JwtPayload,
  ): Promise<CompanyResponseDto> {
    return this.companyService.removeInvoiceLogo(currentUser.organizationId);
  }

  @Post('current/favicon')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSIONS.ORGANIZATION_MANAGE)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MEDIA_MAX_FILE_SIZE },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload the current company favicon' })
  uploadFavicon(
    @CurrentUser() currentUser: JwtPayload,
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<CompanyResponseDto> {
    return this.companyService.uploadFavicon(currentUser.organizationId, file);
  }

  @Delete('current/favicon')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSIONS.ORGANIZATION_MANAGE)
  @ApiOperation({ summary: 'Remove the current company favicon' })
  removeFavicon(
    @CurrentUser() currentUser: JwtPayload,
  ): Promise<CompanyResponseDto> {
    return this.companyService.removeFavicon(currentUser.organizationId);
  }

  @Get('current/backup')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSIONS.ORGANIZATION_MANAGE)
  @ApiOperation({ summary: 'Download a backup of the current company data' })
  createBackup(@CurrentUser() currentUser: JwtPayload) {
    return this.companyDataService.createBackup(currentUser.organizationId);
  }

  @Post('current/restore')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSIONS.ORGANIZATION_MANAGE)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: COMPANY_BACKUP_MAX_FILE_SIZE },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'confirmation', 'ownerPassword'],
      properties: {
        file: { type: 'string', format: 'binary' },
        confirmation: { type: 'string', example: 'RESTORE MYCOMPANY' },
        ownerPassword: { type: 'string' },
      },
    },
  })
  @ApiOperation({ summary: 'Restore Sales/CRM data for the current company' })
  restoreBackup(
    @CurrentUser() currentUser: JwtPayload,
    @Body() dto: RestoreCompanyDataDto,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    return this.companyDataService.restoreBackup(
      currentUser.organizationId,
      currentUser.sub,
      dto.confirmation,
      dto.ownerPassword,
      file,
    );
  }

  @Post('current/reset-data')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSIONS.ORGANIZATION_MANAGE)
  @ApiOperation({ summary: 'Reset Sales/CRM data for the current company' })
  resetData(
    @CurrentUser() currentUser: JwtPayload,
    @Body() dto: ResetCompanyDataDto,
  ) {
    return this.companyDataService.resetData(
      currentUser.organizationId,
      currentUser.sub,
      dto.confirmation,
      dto.ownerPassword,
    );
  }
}
