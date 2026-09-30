import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';

import { AuditEntity } from '../../../common/audit/audit.decorator';
import { RequiresLicense } from '../../../common/licensing/licensing.decorator';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { PERMISSIONS } from '../../auth/permissions/permission.constants';
import type { JwtPayload } from '../../auth/types/jwt-payload.type';
import { RecoveriesService } from './recoveries.service';

type AuthenticatedRequest = Request & { user: JwtPayload };

@ApiTags('Sales - Recoveries')
@ApiBearerAuth()
@AuditEntity('sales.recovery')
@Controller({ path: 'sales/recoveries', version: '1' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions(PERMISSIONS.CRM_ACCESS)
@RequiresLicense('sales')
export class RecoveriesController {
  constructor(private readonly service: RecoveriesService) {}

  @Get()
  list(
    @Req() request: AuthenticatedRequest,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('sort') sort?: string,
    @Query('order') order?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.list(request.user.organizationId, request.user.role, {
      search,
      status,
      sort,
      order,
      page,
      limit,
    });
  }

  @Get('export')
  exportCsv(
    @Req() request: AuthenticatedRequest,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('sort') sort?: string,
    @Query('order') order?: string,
  ) {
    return this.service.export(request.user.organizationId, { search, status, sort, order });
  }

  @Get(':id/statement')
  statement(@Req() request: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.statement(request.user.organizationId, id);
  }

  @Post(':id/payments')
  collect(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { amount: number; method: string; reference?: string; paymentDate: string },
  ) {
    return this.service.collect(
      request.user.organizationId,
      request.user.sub,
      request.user.role,
      id,
      body,
    );
  }

  @Post(':id/void')
  voidBalance(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { password?: string },
  ) {
    return this.service.voidBalance(
      request.user.organizationId,
      request.user.sub,
      request.user.role,
      id,
      body.password ?? '',
    );
  }

  @Post(':id/reminder')
  remind(@Req() request: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.remind(request.user.organizationId, request.user.role, id);
  }
}
