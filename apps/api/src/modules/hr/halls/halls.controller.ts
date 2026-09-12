import {
  Body,
  Controller,
  Delete,
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
import { CreateHallDto, UpdateHallDto } from './dto/hall.dto';
import { HallsService } from './halls.service';

@Controller({
  path: 'hr/halls',
  version: '1',
})
@AuditEntity('hr.hall')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class HallsController {
  constructor(private readonly hallsService: HallsService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.hallsService.listHalls(user.organizationId);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.HR_HALLS_MANAGE)
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateHallDto) {
    return this.hallsService.createHall(user.organizationId, user.sub, dto);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.HR_HALLS_MANAGE)
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) hallId: string,
    @Body() dto: UpdateHallDto,
  ) {
    return this.hallsService.updateHall(user.organizationId, hallId, dto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.HR_HALLS_MANAGE)
  remove(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) hallId: string,
  ) {
    return this.hallsService.removeHall(user.organizationId, hallId);
  }
}
