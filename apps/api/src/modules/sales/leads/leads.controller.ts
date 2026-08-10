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
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import type { Request } from 'express';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../../auth/types/jwt-payload.type';

import { CreateLeadDto } from './dto/create-lead.dto';
import { ListLeadsQueryDto } from './dto/list-leads-query.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { UpdateLeadStatusDto } from './dto/update-lead-status.dto';
import { LeadsFacade } from './leads.facade';

type AuthenticatedRequest = Request & {
  user: JwtPayload;
};

@ApiTags('Sales - Leads')
@ApiBearerAuth()
@Controller({
  path: 'sales/leads',
  version: '1',
})
@UseGuards(JwtAuthGuard)
export class LeadsController {
  constructor(private readonly leadsFacade: LeadsFacade) {}

  @Get()
  list(
    @Req()
    request: AuthenticatedRequest,

    @Query()
    query: ListLeadsQueryDto,
  ) {
    return this.leadsFacade.list(request.user.organizationId, query);
  }

  @Get(':leadId')
  findById(
    @Req()
    request: AuthenticatedRequest,

    @Param('leadId', new ParseUUIDPipe())
    leadId: string,
  ) {
    return this.leadsFacade.findById(request.user.organizationId, leadId);
  }

  @Post()
  create(
    @Req()
    request: AuthenticatedRequest,

    @Body()
    dto: CreateLeadDto,
  ) {
    return this.leadsFacade.create(
      request.user.organizationId,
      request.user.sub,
      dto,
    );
  }

  @Patch(':leadId')
  update(
    @Req()
    request: AuthenticatedRequest,

    @Param('leadId', new ParseUUIDPipe())
    leadId: string,

    @Body()
    dto: UpdateLeadDto,
  ) {
    return this.leadsFacade.update(
      request.user.organizationId,
      leadId,
      request.user.sub,
      dto,
    );
  }

  @Patch(':leadId/status')
  updateStatus(
    @Req()
    request: AuthenticatedRequest,

    @Param('leadId', new ParseUUIDPipe())
    leadId: string,

    @Body()
    dto: UpdateLeadStatusDto,
  ) {
    return this.leadsFacade.updateStatus(
      request.user.organizationId,
      leadId,
      request.user.sub,
      dto.status,
    );
  }

  @Delete(':leadId')
  @HttpCode(HttpStatus.NO_CONTENT)
  archive(
    @Req()
    request: AuthenticatedRequest,

    @Param('leadId', new ParseUUIDPipe())
    leadId: string,
  ): Promise<void> {
    return this.leadsFacade.archive(
      request.user.organizationId,
      leadId,
      request.user.sub,
    );
  }
}
