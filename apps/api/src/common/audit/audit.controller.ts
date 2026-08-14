import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../modules/auth/decorators/current-user.decorator';
import { RequirePermissions } from '../../modules/auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../modules/auth/guards/permissions.guard';
import { PERMISSIONS } from '../../modules/auth/permissions/permission.constants';
import type { JwtPayload } from '../../modules/auth/types/jwt-payload.type';
import { AuditService } from './audit.service';
import { ListAuditLogsQueryDto } from './dto/list-audit-logs-query.dto';

@ApiTags('Audit')
@ApiBearerAuth()
@Controller({ path: 'audit-logs', version: '1' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions(PERMISSIONS.AUDIT_READ)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  list(
    @CurrentUser() currentUser: JwtPayload,
    @Query() query: ListAuditLogsQueryDto,
  ) {
    return this.auditService.list(currentUser.organizationId, query);
  }
}
