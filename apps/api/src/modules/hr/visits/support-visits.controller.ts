import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { AuditEntity } from '../../../common/audit/audit.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { PERMISSIONS } from '../../auth/permissions/permission.constants';
import type { JwtPayload } from '../../auth/types/jwt-payload.type';
import {
  CreateSupportVisitDto,
  UpdateSupportVisitDto,
} from './dto/support-visit.dto';
import { VisitsService } from './visits.service';

@Controller({
  path: 'hr/support-visits',
  version: '1',
})
@AuditEntity('hr.support-visit')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SupportVisitsController {
  constructor(private readonly visitsService: VisitsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.HR_VISITS_MANAGE)
  list(@CurrentUser() user: JwtPayload) {
    return this.visitsService.listSupport(user.organizationId);
  }

  @Get('mine')
  listMine(@CurrentUser() user: JwtPayload) {
    return this.visitsService.listMySupport(user.organizationId, user.sub);
  }

  @Post()
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateSupportVisitDto,
  ) {
    return this.visitsService.createSupport(user.organizationId, user.sub, dto);
  }

  @Get(':id')
  findById(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) visitId: string,
  ) {
    return this.visitsService.findSupport(
      user.organizationId,
      user.sub,
      user.role,
      visitId,
    );
  }

  @Patch(':id')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) visitId: string,
    @Body() dto: UpdateSupportVisitDto,
  ) {
    return this.visitsService.updateSupport(
      user.organizationId,
      user.sub,
      user.role,
      visitId,
      dto,
    );
  }
}
