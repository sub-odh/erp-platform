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
import { RequiresLicense } from '../../../common/licensing/licensing.decorator';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { PERMISSIONS } from '../../auth/permissions/permission.constants';
import type { JwtPayload } from '../../auth/types/jwt-payload.type';
import {
  CreateDeliveryOrderDto,
  PurgeDeliveryOrderDto,
  UpdateDeliveryOrderDto,
} from './dto/delivery-order.dto';
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

  @Get('lookups')
  lookups(@Req() request: AuthenticatedRequest) {
    return this.service.lookups(request.user.organizationId);
  }

  @Get('draft')
  draft(
    @Req() request: AuthenticatedRequest,
    @Query('date') date?: string,
  ) {
    const today = new Date().toISOString().slice(0, 10);
    return this.service.previewNumber(request.user.organizationId, date || today);
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
    @Body() dto: CreateDeliveryOrderDto,
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
    @Body() dto: UpdateDeliveryOrderDto,
  ) {
    return this.service.update(
      request.user.organizationId,
      request.user.sub,
      id,
      dto,
    );
  }

  @Post(':id/void')
  voidOrder(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.voidOrder(
      request.user.organizationId,
      request.user.sub,
      id,
    );
  }

  @Post(':id/purge')
  purge(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PurgeDeliveryOrderDto,
  ) {
    return this.service.purge(
      request.user.organizationId,
      request.user.sub,
      request.user.role,
      id,
      dto.password,
    );
  }
}
