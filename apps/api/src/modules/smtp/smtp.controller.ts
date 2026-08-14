import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { AuditEntity } from '../../common/audit/audit.decorator';
import { RequiresLicense } from '../../common/licensing/licensing.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { PERMISSIONS } from '../auth/permissions/permission.constants';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { UpdateSmtpConfigurationDto } from './dto/update-smtp-configuration.dto';
import { SmtpService } from './smtp.service';

@ApiTags('SMTP')
@ApiBearerAuth()
@AuditEntity('platform.smtp-configuration')
@RequiresLicense('admin')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions(PERMISSIONS.SMTP_MANAGE)
@Controller({ path: 'smtp', version: '1' })
export class SmtpController {
  constructor(private readonly smtp: SmtpService) {}

  @Get('current')
  getCurrent(@CurrentUser() user: JwtPayload) {
    return this.smtp.getCurrent(user.organizationId);
  }

  @Patch('current')
  updateCurrent(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateSmtpConfigurationDto,
  ) {
    return this.smtp.updateCurrent(user.organizationId, dto);
  }

  @Post('current/test')
  testCurrent(@CurrentUser() user: JwtPayload) {
    return this.smtp.testCurrent(user.organizationId);
  }
}
