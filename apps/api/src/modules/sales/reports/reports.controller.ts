import { Controller, Get, Param, ParseUUIDPipe, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';

import { AuditEntity } from '../../../common/audit/audit.decorator';
import { RequiresLicense } from '../../../common/licensing/licensing.decorator';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { PERMISSIONS } from '../../auth/permissions/permission.constants';
import type { JwtPayload } from '../../auth/types/jwt-payload.type';
import { ReportsService } from './reports.service';

type AuthenticatedRequest = Request & { user: JwtPayload };

@ApiTags('Sales - Reports')
@ApiBearerAuth()
@AuditEntity('sales.report')
@Controller({ path: 'sales/reports', version: '1' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions(PERMISSIONS.CRM_ACCESS)
@RequiresLicense('sales')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get('trend')
  trend(@Req() request: AuthenticatedRequest, @Query('month') month?: string) {
    return this.service.trend(request.user.organizationId, month);
  }

  @Get('targets')
  targets(@Req() request: AuthenticatedRequest) {
    return this.service.targets(
      request.user.organizationId,
      request.user.sub,
      request.user.role,
    );
  }

  @Get('targets/:employeeId/recoveries')
  recoveries(
    @Req() request: AuthenticatedRequest,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Query('range') range?: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return this.service.recoveries(
      request.user.organizationId,
      request.user.sub,
      request.user.role,
      employeeId,
      range === 'yearly' ? 'yearly' : 'monthly',
      start,
      end,
    );
  }

  @Get('staff/:employeeId/invoices')
  invoices(
    @Req() request: AuthenticatedRequest,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Query('start') start = '',
    @Query('end') end = '',
  ) {
    return this.service.invoiceBreakdown(request.user.organizationId, employeeId, start, end);
  }

  @Get('staff/:employeeId/won')
  won(
    @Req() request: AuthenticatedRequest,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Query('start') start = '',
    @Query('end') end = '',
  ) {
    return this.service.wonBreakdown(request.user.organizationId, employeeId, start, end);
  }
}
