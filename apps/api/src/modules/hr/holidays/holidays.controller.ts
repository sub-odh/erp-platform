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
import { CreateHolidayDto, UpdateHolidayDto } from './dto/holiday.dto';
import { HolidaysService } from './holidays.service';

@Controller({
  path: 'hr/holidays',
  version: '1',
})
@AuditEntity('hr.holiday')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class HolidaysController {
  constructor(private readonly holidaysService: HolidaysService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.holidaysService.list(user.organizationId);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.HR_HOLIDAYS_MANAGE)
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateHolidayDto) {
    return this.holidaysService.create(user.organizationId, user.sub, dto);
  }

  @Patch(':holidayId')
  @RequirePermissions(PERMISSIONS.HR_HOLIDAYS_MANAGE)
  update(
    @CurrentUser() user: JwtPayload,
    @Param('holidayId', new ParseUUIDPipe()) holidayId: string,
    @Body() dto: UpdateHolidayDto,
  ) {
    return this.holidaysService.update(
      user.organizationId,
      user.sub,
      holidayId,
      dto,
    );
  }

  @Delete(':holidayId')
  @RequirePermissions(PERMISSIONS.HR_HOLIDAYS_MANAGE)
  remove(
    @CurrentUser() user: JwtPayload,
    @Param('holidayId', new ParseUUIDPipe()) holidayId: string,
  ) {
    return this.holidaysService.remove(user.organizationId, holidayId);
  }
}
