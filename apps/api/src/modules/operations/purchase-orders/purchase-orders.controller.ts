import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';

import { AuditEntity } from '../../../common/audit/audit.decorator';
import { RequiresLicense } from '../../../common/licensing/licensing.decorator';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { PERMISSIONS } from '../../auth/permissions/permission.constants';
import type { JwtPayload } from '../../auth/types/jwt-payload.type';
import {
  CreatePurchaseOrderDto,
  ListPurchaseOrdersQueryDto,
} from './dto/purchase-order.dto';
import { PurchaseOrdersService } from './purchase-orders.service';

type AuthenticatedRequest = Request & { user: JwtPayload };

@ApiTags('Operations - Purchase Orders')
@ApiBearerAuth()
@AuditEntity('operations.purchase-order')
@RequiresLicense('inventory')
@Controller({ path: 'operations/purchase-orders', version: '1' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions(PERMISSIONS.INVENTORY_ACCESS)
export class PurchaseOrdersController {
  constructor(private readonly service: PurchaseOrdersService) {}

  @Get()
  list(
    @Req() request: AuthenticatedRequest,
    @Query() query: ListPurchaseOrdersQueryDto,
  ) {
    return this.service.list(request.user.organizationId, query);
  }

  @Get('next-number')
  nextNumber(
    @Req() request: AuthenticatedRequest,
    @Query('date') date: string,
  ) {
    return this.service.nextNumber(
      request.user.organizationId,
      date || new Date().toISOString().slice(0, 10),
    );
  }

  @Get(':id')
  findDetails(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.service.findDetails(request.user.organizationId, id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.INVENTORY_MANAGE)
  create(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreatePurchaseOrderDto,
  ) {
    return this.service.create(
      request.user.organizationId,
      request.user.sub,
      dto,
    );
  }

  @Post(':id/email')
  @RequirePermissions(PERMISSIONS.INVENTORY_MANAGE)
  sendEmail(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.service.sendEmail(request.user.organizationId, id);
  }
}
