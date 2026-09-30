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
  DispatchPurchaseOrderDto,
  ListPurchaseOrdersQueryDto,
  PurgePurchaseOrderDto,
  SavePurchaseOrderDto,
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

  @Get('draft')
  draft(@Req() request: AuthenticatedRequest) {
    return this.service.draft(request.user.organizationId, request.user.sub);
  }

  @Post('dispatch-email')
  dispatch(
    @Req() request: AuthenticatedRequest,
    @Body() dto: DispatchPurchaseOrderDto,
  ) {
    return this.service.dispatch(request.user.organizationId, dto);
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
    @Body() dto: SavePurchaseOrderDto,
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
    @Body() dto: SavePurchaseOrderDto,
  ) {
    return this.service.update(request.user.organizationId, id, dto);
  }

  @Post(':id/purge')
  purge(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PurgePurchaseOrderDto,
  ) {
    return this.service.purge(
      request.user.organizationId,
      request.user.sub,
      id,
      dto.password,
    );
  }
}
