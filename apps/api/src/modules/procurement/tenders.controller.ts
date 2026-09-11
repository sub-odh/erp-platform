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
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';

import { AuditEntity } from '../../common/audit/audit.decorator';
import { RequiresLicense } from '../../common/licensing/licensing.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { PERMISSIONS } from '../auth/permissions/permission.constants';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import {
  CreateTenderDto,
  ListTendersQueryDto,
  UpdateTenderDto,
} from './dto/tender.dto';
import { ProcurementService } from './procurement.service';

type AuthenticatedRequest = Request & { user: JwtPayload };

@ApiTags('Procurement - Tenders')
@ApiBearerAuth()
@AuditEntity('procurement.tender')
@RequiresLicense('inventory')
@Controller({ path: 'procurement/tenders', version: '1' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions(PERMISSIONS.INVENTORY_ACCESS)
export class TendersController {
  constructor(private readonly service: ProcurementService) {}

  @Get()
  list(
    @Req() request: AuthenticatedRequest,
    @Query() query: ListTendersQueryDto,
  ) {
    return this.service.listTenders(request.user.organizationId, query);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.INVENTORY_MANAGE)
  create(@Req() request: AuthenticatedRequest, @Body() dto: CreateTenderDto) {
    return this.service.createTender(
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
    @Body() dto: UpdateTenderDto,
  ) {
    return this.service.updateTender(
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
    return this.service.deleteTender(
      request.user.organizationId,
      id,
      request.user.sub,
    );
  }
}
