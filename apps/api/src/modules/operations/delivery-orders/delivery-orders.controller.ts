import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';

import { AuditEntity } from '../../../common/audit/audit.decorator';
import { RequiresLicense } from '../../../common/licensing/licensing.decorator';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { PERMISSIONS } from '../../auth/permissions/permission.constants';
import type { JwtPayload } from '../../auth/types/jwt-payload.type';
import { CreateDeliveryOrderDto } from './dto/delivery-order.dto';
import { DeliveryOrdersService } from './delivery-orders.service';

type AuthenticatedRequest = Request & { user: JwtPayload };

@ApiTags('Operations - Delivery Orders')
@ApiBearerAuth()
@AuditEntity('operations.delivery-order')
@RequiresLicense('inventory')
@Controller({ path: 'operations/delivery-orders', version: '1' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions(PERMISSIONS.INVENTORY_ACCESS)
export class DeliveryOrdersController {
  constructor(private readonly service: DeliveryOrdersService) {}

  @Get()
  list(@Req() request: AuthenticatedRequest) {
    return this.service.list(request.user.organizationId);
  }

  @Get('available-assets')
  listAvailableAssets(@Req() request: AuthenticatedRequest) {
    return this.service.listAvailableAssets(request.user.organizationId);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.INVENTORY_MANAGE)
  create(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateDeliveryOrderDto,
  ) {
    return this.service.create(
      request.user.organizationId,
      request.user.sub,
      dto,
    );
  }
}
