import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import type { Request } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { DashboardService } from './dashboard.service';

class DashboardQueryDto {
  @IsOptional()
  @IsString()
  inv_month?: string;

  @IsOptional()
  @IsString()
  sales_month?: string;
}

class DashboardActionDto {
  @IsOptional()
  @IsString()
  mark_back_id?: string;

  @IsOptional()
  @IsString()
  visit_remarks?: string;

  @IsOptional()
  @IsString()
  confirm_sub_id?: string;

  @IsOptional()
  @IsString()
  reject_sub_id?: string;
}

type AuthenticatedRequest = Request & { user: JwtPayload };

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller({ path: 'dashboard', version: '1' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get()
  overview(
    @Req() request: AuthenticatedRequest,
    @Query() query: DashboardQueryDto,
  ) {
    return this.service.overview(
      request.user.organizationId,
      request.user.sub,
      request.user.role,
      query,
    );
  }

  @Post('actions')
  async action(
    @Req() request: AuthenticatedRequest,
    @Body() body: DashboardActionDto,
  ) {
    await this.service.applyAction(
      request.user.organizationId,
      request.user.sub,
      body,
    );

    return { ok: true };
  }
}
