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
  CreateFuelDto,
  ReimburseFuelDto,
  UpdateFuelSettingsDto,
} from './dto/fuel.dto';
import { FuelService } from './fuel.service';

@Controller({
  path: 'hr/fuel',
  version: '1',
})
@AuditEntity('hr.fuel')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FuelController {
  constructor(private readonly fuelService: FuelService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.HR_EXPENSES_MANAGE)
  list(@CurrentUser() user: JwtPayload) {
    return this.fuelService.list(user.organizationId);
  }

  @Get('settings')
  @RequirePermissions(PERMISSIONS.HR_EXPENSES_MANAGE)
  getSettings(@CurrentUser() user: JwtPayload) {
    return this.fuelService.getSettings(user.organizationId);
  }

  @Get('mine')
  listMine(@CurrentUser() user: JwtPayload) {
    return this.fuelService.listMine(user.organizationId, user.sub);
  }

  @Patch('settings')
  @RequirePermissions(PERMISSIONS.HR_EXPENSES_MANAGE)
  updateSettings(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateFuelSettingsDto,
  ) {
    return this.fuelService.updateSettings(
      user.organizationId,
      user.sub,
      dto,
    );
  }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateFuelDto) {
    return this.fuelService.create(user.organizationId, user.sub, dto);
  }

  @Post(':id/approve')
  @RequirePermissions(PERMISSIONS.HR_EXPENSES_MANAGE)
  approve(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) recordId: string,
  ) {
    return this.fuelService.approve(user.organizationId, user.sub, recordId);
  }

  @Post(':id/reject')
  @RequirePermissions(PERMISSIONS.HR_EXPENSES_MANAGE)
  reject(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) recordId: string,
  ) {
    return this.fuelService.reject(user.organizationId, user.sub, recordId);
  }

  @Post(':id/reimburse')
  @RequirePermissions(PERMISSIONS.HR_EXPENSES_MANAGE)
  reimburse(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) recordId: string,
    @Body() dto: ReimburseFuelDto,
  ) {
    return this.fuelService.reimburse(
      user.organizationId,
      user.sub,
      recordId,
      dto,
    );
  }
}
