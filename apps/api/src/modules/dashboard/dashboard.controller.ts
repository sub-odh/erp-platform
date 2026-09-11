import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsOptional, Matches } from 'class-validator';
import type { Request } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { DashboardService } from './dashboard.service';

class DashboardQueryDto {
  @IsOptional()
  @Matches(/^\d{4}-\d{2}$/)
  invMonth?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}$/)
  salesMonth?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}$/)
  distMonth?: string;
}

type AuthenticatedRequest = Request & { user: JwtPayload };

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller({ path: 'dashboard', version: '1' })
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get()
  overview(
    @Req() request: AuthenticatedRequest,
    @Query() query: DashboardQueryDto,
  ) {
    return this.service.overview(request.user.organizationId, query);
  }
}
