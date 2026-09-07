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
import { ReceiveGoodsDto } from './dto/goods-receipt.dto';
import { GoodsReceiptsService } from './goods-receipts.service';

type AuthenticatedRequest = Request & { user: JwtPayload };

@ApiTags('Operations - Goods Receipts')
@ApiBearerAuth()
@AuditEntity('operations.goods-receipt')
@RequiresLicense('inventory')
@Controller({ path: 'operations/goods-receipts', version: '1' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions(PERMISSIONS.INVENTORY_ACCESS)
export class GoodsReceiptsController {
  constructor(private readonly service: GoodsReceiptsService) {}

  @Get()
  list(@Req() request: AuthenticatedRequest) {
    return this.service.list(request.user.organizationId);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.INVENTORY_MANAGE)
  receive(@Req() request: AuthenticatedRequest, @Body() dto: ReceiveGoodsDto) {
    return this.service.receive(
      request.user.organizationId,
      request.user.sub,
      dto,
    );
  }
}
