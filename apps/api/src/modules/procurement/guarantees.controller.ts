import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { memoryStorage } from 'multer';

import { AuditEntity } from '../../common/audit/audit.decorator';
import { RequiresLicense } from '../../common/licensing/licensing.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { PERMISSIONS } from '../auth/permissions/permission.constants';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { MEDIA_MAX_DOCUMENT_SIZE } from '../media/constants';
import { MediaService } from '../media/media.service';
import {
  CreateGuaranteeDto,
  ListGuaranteesQueryDto,
  ReleaseGuaranteeDto,
  UpdateGuaranteeDto,
} from './dto/guarantee.dto';
import { ProcurementService } from './procurement.service';

type AuthenticatedRequest = Request & { user: JwtPayload };

@ApiTags('Procurement - Guarantees')
@ApiBearerAuth()
@AuditEntity('procurement.guarantee')
@RequiresLicense('inventory')
@Controller({ path: 'procurement/guarantees', version: '1' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions(PERMISSIONS.INVENTORY_ACCESS)
export class GuaranteesController {
  constructor(
    private readonly service: ProcurementService,
    private readonly mediaService: MediaService,
  ) {}

  @Get()
  list(
    @Req() request: AuthenticatedRequest,
    @Query() query: ListGuaranteesQueryDto,
  ) {
    return this.service.listGuarantees(request.user.organizationId, query);
  }

  @Post('documents')
  @RequirePermissions(PERMISSIONS.INVENTORY_MANAGE)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MEDIA_MAX_DOCUMENT_SIZE },
    }),
  )
  @ApiConsumes('multipart/form-data')
  uploadDocument(@UploadedFile() file: Express.Multer.File) {
    return this.mediaService.uploadDocument(file, 'procurement');
  }

  @Post()
  @RequirePermissions(PERMISSIONS.INVENTORY_MANAGE)
  create(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateGuaranteeDto,
  ) {
    return this.service.createGuarantee(
      request.user.organizationId,
      request.user.sub,
      dto,
    );
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.INVENTORY_MANAGE)
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateGuaranteeDto,
  ) {
    return this.service.updateGuarantee(
      request.user.organizationId,
      id,
      request.user.sub,
      dto,
    );
  }

  @Post(':id/release')
  @RequirePermissions(PERMISSIONS.INVENTORY_MANAGE)
  release(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ReleaseGuaranteeDto,
  ) {
    return this.service.releaseGuarantee(
      request.user.organizationId,
      id,
      request.user.sub,
      dto,
    );
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.INVENTORY_MANAGE)
  remove(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.service.deleteGuarantee(
      request.user.organizationId,
      id,
      request.user.sub,
    );
  }
}
