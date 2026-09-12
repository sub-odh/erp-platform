import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { AuditEntity } from '../../../common/audit/audit.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { PERMISSIONS } from '../../auth/permissions/permission.constants';
import type { JwtPayload } from '../../auth/types/jwt-payload.type';
import { AttendanceService } from './attendance.service';
import {
  CreateAttendanceDto,
  ListAttendanceQueryDto,
  MineAttendanceQueryDto,
  ReportAttendanceQueryDto,
  UpdateAttendanceDto,
} from './dto/attendance.dto';

@Controller({
  path: 'hr/attendance',
  version: '1',
})
@AuditEntity('hr.attendance')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.HR_ATTENDANCE_MANAGE)
  list(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListAttendanceQueryDto,
  ) {
    return this.attendanceService.list(user.organizationId, query);
  }

  @Get('mine')
  listMine(
    @CurrentUser() user: JwtPayload,
    @Query() query: MineAttendanceQueryDto,
  ) {
    return this.attendanceService.listMine(
      user.organizationId,
      user.sub,
      query,
    );
  }

  @Get('report')
  @RequirePermissions(PERMISSIONS.HR_ATTENDANCE_MANAGE)
  report(
    @CurrentUser() user: JwtPayload,
    @Query() query: ReportAttendanceQueryDto,
  ) {
    return this.attendanceService.report(user.organizationId, query);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.HR_ATTENDANCE_MANAGE)
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateAttendanceDto) {
    return this.attendanceService.create(user.organizationId, user.sub, dto);
  }

  @Post('check-in')
  checkIn(@CurrentUser() user: JwtPayload) {
    return this.attendanceService.checkIn(user.organizationId, user.sub);
  }

  @Post('check-out')
  checkOut(@CurrentUser() user: JwtPayload) {
    return this.attendanceService.checkOut(user.organizationId, user.sub);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.HR_ATTENDANCE_MANAGE)
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) attendanceId: string,
    @Body() dto: UpdateAttendanceDto,
  ) {
    return this.attendanceService.update(
      user.organizationId,
      user.sub,
      attendanceId,
      dto,
    );
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.HR_ATTENDANCE_MANAGE)
  remove(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) attendanceId: string,
  ) {
    return this.attendanceService.remove(user.organizationId, attendanceId);
  }
}
