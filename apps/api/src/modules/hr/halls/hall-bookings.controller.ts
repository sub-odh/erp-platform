import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
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
import { CreateHallBookingDto } from './dto/hall.dto';
import { HallsService } from './halls.service';

@Controller({
  path: 'hr/hall-bookings',
  version: '1',
})
@AuditEntity('hr.hall-booking')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class HallBookingsController {
  constructor(private readonly hallsService: HallsService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.hallsService.listBookings(
      user.organizationId,
      user.sub,
      user.role,
    );
  }

  @Get('mine')
  listMine(@CurrentUser() user: JwtPayload) {
    return this.hallsService.listMine(user.organizationId, user.sub);
  }

  @Post()
  book(@CurrentUser() user: JwtPayload, @Body() dto: CreateHallBookingDto) {
    return this.hallsService.book(user.organizationId, user.sub, dto);
  }

  @Post(':id/confirm')
  @RequirePermissions(PERMISSIONS.HR_HALLS_MANAGE)
  @HttpCode(HttpStatus.OK)
  confirm(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) bookingId: string,
  ) {
    return this.hallsService.confirmBooking(user.organizationId, bookingId);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  cancel(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) bookingId: string,
  ) {
    return this.hallsService.cancelBooking(
      user.organizationId,
      user.sub,
      user.role,
      bookingId,
    );
  }
}
