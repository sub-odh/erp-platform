import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';

import { AuditEntity } from '../../../common/audit/audit.decorator';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { PERMISSIONS } from '../../auth/permissions/permission.constants';
import type { JwtPayload } from '../../auth/types/jwt-payload.type';
import { SaveCloudQuotationDto } from './dto/cloud-quotation.dto';
import { CloudQuotationsService } from './cloud-quotations.service';

type AuthenticatedRequest = Request & { user: JwtPayload };

@ApiTags('Sales - Cloud Quotations')
@ApiBearerAuth()
@AuditEntity('sales.cloud-quotation')
@Controller({ path: 'sales/cloud-quotations', version: '1' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions(PERMISSIONS.CRM_ACCESS)
export class CloudQuotationsController {
  constructor(private readonly service: CloudQuotationsService) {}

  @Get()
  list(@Req() request: AuthenticatedRequest) {
    return this.service.list(request.user.organizationId);
  }

  @Get('draft')
  draft() {
    return this.service.draft();
  }

  @Get(':id')
  details(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.findDetails(request.user.organizationId, id);
  }

  @Post()
  create(
    @Req() request: AuthenticatedRequest,
    @Body() dto: SaveCloudQuotationDto,
  ) {
    return this.service.create(
      request.user.organizationId,
      request.user.sub,
      dto,
    );
  }

  @Put(':id')
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SaveCloudQuotationDto,
  ) {
    return this.service.update(request.user.organizationId, id, dto);
  }

  @Post(':id/purge')
  purge(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.purge(
      request.user.organizationId,
      request.user.role,
      id,
    );
  }
}
