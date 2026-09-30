import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
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
import {
  ListQuotationsQueryDto,
  PurgeQuotationDto,
  SaveQuotationDto,
} from './dto/quotation.dto';
import { QuotationsService } from './quotations.service';

type AuthenticatedRequest = Request & { user: JwtPayload };

@ApiTags('Sales - Quotations')
@ApiBearerAuth()
@AuditEntity('sales.quotation')
@Controller({ path: 'sales/quotations', version: '1' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions(PERMISSIONS.CRM_ACCESS)
export class QuotationsController {
  constructor(private readonly service: QuotationsService) {}

  @Get()
  list(
    @Req() request: AuthenticatedRequest,
    @Query() query: ListQuotationsQueryDto,
  ) {
    return this.service.list(request.user.organizationId, query);
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
    @Body() dto: SaveQuotationDto,
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
    @Body() dto: SaveQuotationDto,
  ) {
    return this.service.update(request.user.organizationId, id, dto);
  }

  @Post(':id/purge')
  purge(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PurgeQuotationDto,
  ) {
    return this.service.purge(
      request.user.organizationId,
      request.user.sub,
      id,
      dto.password,
    );
  }
}
