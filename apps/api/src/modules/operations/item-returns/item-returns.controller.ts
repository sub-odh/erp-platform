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
import { CreateItemReturnDto } from './dto/item-return.dto';
import { ItemReturnsService } from './item-returns.service';

type AuthenticatedRequest = Request & { user: JwtPayload };

@ApiTags('Operations - Item Returns')
@ApiBearerAuth()
@AuditEntity('operations.item-return')
@RequiresLicense('inventory')
@Controller({ path: 'operations/item-returns', version: '1' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions(PERMISSIONS.INVENTORY_ACCESS)
export class ItemReturnsController {
  constructor(private readonly service: ItemReturnsService) {}

  @Get()
  list(@Req() request: AuthenticatedRequest) {
    return this.service.list(request.user.organizationId);
  }

  @Get('returnable-assets')
  listReturnableAssets(@Req() request: AuthenticatedRequest) {
    return this.service.listReturnableAssets(request.user.organizationId);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.INVENTORY_MANAGE)
  create(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateItemReturnDto,
  ) {
    return this.service.create(
      request.user.organizationId,
      request.user.sub,
      dto,
    );
  }
}
