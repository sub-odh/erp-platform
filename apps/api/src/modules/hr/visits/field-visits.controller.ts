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
import { CreateFieldVisitDto, UpdateFieldVisitDto } from './dto/field-visit.dto';
import { VisitsService } from './visits.service';

@Controller({
  path: 'hr/field-visits',
  version: '1',
})
@AuditEntity('hr.field-visit')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FieldVisitsController {
  constructor(private readonly visitsService: VisitsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.HR_VISITS_MANAGE)
  list(@CurrentUser() user: JwtPayload) {
    return this.visitsService.listField(user.organizationId);
  }

  @Get('mine')
  listMine(@CurrentUser() user: JwtPayload) {
    return this.visitsService.listMyField(user.organizationId, user.sub);
  }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateFieldVisitDto) {
    return this.visitsService.createField(user.organizationId, user.sub, dto);
  }

  @Patch(':id')
  checkIn(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) visitId: string,
    @Body() dto: UpdateFieldVisitDto,
  ) {
    return this.visitsService.checkInField(
      user.organizationId,
      user.sub,
      user.role,
      visitId,
      dto,
    );
  }
}
