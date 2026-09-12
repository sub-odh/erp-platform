import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
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
  CreateEmergencyLeaveDto,
  CreateLeaveRequestDto,
  ReviewLeaveDto,
  UpdateLeaveBalancesDto,
} from './dto/leave.dto';
import { LeavesService } from './leaves.service';

@Controller({
  path: 'hr/leaves',
  version: '1',
})
@AuditEntity('hr.leave')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class LeavesController {
  constructor(private readonly leavesService: LeavesService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.HR_LEAVES_MANAGE)
  dashboard(@CurrentUser() user: JwtPayload) {
    return this.leavesService.dashboard(user.organizationId);
  }

  @Get('mine')
  listMine(@CurrentUser() user: JwtPayload) {
    return this.leavesService.listMine(user.organizationId, user.sub);
  }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateLeaveRequestDto) {
    return this.leavesService.create(user.organizationId, user.sub, dto);
  }

  @Post('emergency')
  @RequirePermissions(PERMISSIONS.HR_LEAVES_MANAGE)
  createEmergency(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateEmergencyLeaveDto,
  ) {
    return this.leavesService.createEmergency(
      user.organizationId,
      user.sub,
      dto,
    );
  }

  @Patch('balances')
  @RequirePermissions(PERMISSIONS.HR_LEAVES_MANAGE)
  updateBalances(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateLeaveBalancesDto,
  ) {
    return this.leavesService.updateBalances(user.organizationId, dto);
  }

  @Post(':id/approve')
  @RequirePermissions(PERMISSIONS.HR_LEAVES_MANAGE)
  @HttpCode(HttpStatus.OK)
  approve(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) requestId: string,
    @Body() dto: ReviewLeaveDto,
  ) {
    return this.leavesService.approve(
      user.organizationId,
      user.sub,
      requestId,
      dto,
    );
  }

  @Post(':id/reject')
  @RequirePermissions(PERMISSIONS.HR_LEAVES_MANAGE)
  @HttpCode(HttpStatus.OK)
  reject(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) requestId: string,
    @Body() dto: ReviewLeaveDto,
  ) {
    return this.leavesService.reject(
      user.organizationId,
      user.sub,
      requestId,
      dto,
    );
  }

  @Delete(':id')
  revoke(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) requestId: string,
  ) {
    return this.leavesService.revoke(user.organizationId, user.sub, requestId);
  }
}
