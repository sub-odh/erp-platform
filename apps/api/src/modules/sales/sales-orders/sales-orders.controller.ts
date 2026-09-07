import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';

import { AuditEntity } from '../../../common/audit/audit.decorator';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { PERMISSIONS } from '../../auth/permissions/permission.constants';
import type { JwtPayload } from '../../auth/types/jwt-payload.type';
import { SalesOrdersService } from './sales-orders.service';

type AuthenticatedRequest = Request & { user: JwtPayload };

@ApiTags('Sales - Orders')
@ApiBearerAuth()
@AuditEntity('sales.order')
@Controller({ path: 'sales/orders', version: '1' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions(PERMISSIONS.CRM_ACCESS)
export class SalesOrdersController {
  constructor(private readonly service: SalesOrdersService) {}

  @Get('report')
  report(@Req() request: AuthenticatedRequest) {
    return this.service.report(request.user.organizationId);
  }
}
