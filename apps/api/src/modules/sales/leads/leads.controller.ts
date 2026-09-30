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
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { AuditEntity } from '../../../common/audit/audit.decorator';

import type { Request } from 'express';

import { RequirePermissions } from '../../auth/decorators/permissions.decorator';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { PERMISSIONS } from '../../auth/permissions/permission.constants';

import type { JwtPayload } from '../../auth/types/jwt-payload.type';

import { ConvertLeadDto } from './dto/convert-lead.dto';

import { CreateLeadDto } from './dto/create-lead.dto';

import { ListLeadsQueryDto } from './dto/list-leads-query.dto';

import { UpdateLeadDto } from './dto/update-lead.dto';

import { UpdateLeadStatusDto } from './dto/update-lead-status.dto';

import { LeadsFacade } from './leads.facade';
import {
  CreatePipelineLeadDto,
  PipelineQueryDto,
  PostPipelineActivityDto,
  SetFinalQuotationDto,
  UpdatePipelineProfileDto,
  UpdatePipelineSettingsDto,
  UpdatePipelineSourceDto,
  UpdatePipelineStageDto,
} from './pipeline.dto';
import { PipelineService } from './pipeline.service';

type AuthenticatedRequest = Request & {
  user: JwtPayload;
};

@ApiTags('Sales - Leads')
@ApiBearerAuth()
@AuditEntity('sales.lead')
@Controller({
  path: 'sales/leads',

  version: '1',
})
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions(PERMISSIONS.CRM_ACCESS)
export class LeadsController {
  constructor(
    private readonly leadsFacade: LeadsFacade,
    private readonly pipeline: PipelineService,
  ) {}

  @Get('pipeline')
  pipelineList(
    @Req() request: AuthenticatedRequest,
    @Query() query: PipelineQueryDto,
  ) {
    return this.pipeline.list(request.user.organizationId, request.user.sub, query);
  }

  @Post('pipeline')
  pipelineCreate(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreatePipelineLeadDto,
  ) {
    return this.pipeline.create(request.user.organizationId, request.user.sub, dto);
  }

  @Get(':leadId/deal')
  deal(
    @Req() request: AuthenticatedRequest,
    @Param('leadId', new ParseUUIDPipe()) leadId: string,
  ) {
    return this.pipeline.details(
      request.user.organizationId,
      request.user.sub,
      request.user.role,
      leadId,
    );
  }

  @Patch(':leadId/stage')
  stage(
    @Req() request: AuthenticatedRequest,
    @Param('leadId', new ParseUUIDPipe()) leadId: string,
    @Body() dto: UpdatePipelineStageDto,
  ) {
    return this.pipeline.updateStage(request.user.organizationId, leadId, dto.stage);
  }

  @Put(':leadId/profile')
  profile(
    @Req() request: AuthenticatedRequest,
    @Param('leadId', new ParseUUIDPipe()) leadId: string,
    @Body() dto: UpdatePipelineProfileDto,
  ) {
    return this.pipeline.updateProfile(request.user.organizationId, leadId, dto);
  }

  @Patch(':leadId/source')
  source(
    @Req() request: AuthenticatedRequest,
    @Param('leadId', new ParseUUIDPipe()) leadId: string,
    @Body() dto: UpdatePipelineSourceDto,
  ) {
    return this.pipeline.updateSource(request.user.organizationId, leadId, dto);
  }

  @Post(':leadId/activity')
  activity(
    @Req() request: AuthenticatedRequest,
    @Param('leadId', new ParseUUIDPipe()) leadId: string,
    @Body() dto: PostPipelineActivityDto,
  ) {
    return this.pipeline.postActivity(request.user.organizationId, leadId, dto);
  }

  @Put(':leadId/settings')
  settings(
    @Req() request: AuthenticatedRequest,
    @Param('leadId', new ParseUUIDPipe()) leadId: string,
    @Body() dto: UpdatePipelineSettingsDto,
  ) {
    return this.pipeline.updateSettings(request.user.organizationId, leadId, dto);
  }

  @Post(':leadId/final-quotation')
  finalQuotation(
    @Req() request: AuthenticatedRequest,
    @Param('leadId', new ParseUUIDPipe()) leadId: string,
    @Body() dto: SetFinalQuotationDto,
  ) {
    return this.pipeline.setFinal(request.user.organizationId, leadId, dto.quotationId);
  }

  @Post(':leadId/purge')
  purge(
    @Req() request: AuthenticatedRequest,
    @Param('leadId', new ParseUUIDPipe()) leadId: string,
  ) {
    return this.pipeline.purge(request.user.organizationId, leadId);
  }

  @Get()
  list(
    @Req()
    request: AuthenticatedRequest,

    @Query()
    query: ListLeadsQueryDto,
  ) {
    return this.leadsFacade.list(
      request.user.organizationId,

      query,
    );
  }

  @Get(':leadId')
  findById(
    @Req()
    request: AuthenticatedRequest,

    @Param('leadId', new ParseUUIDPipe())
    leadId: string,
  ) {
    return this.leadsFacade.findById(
      request.user.organizationId,

      leadId,
    );
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

  @Post(':leadId/convert')
  convert(
    @Req()
    request: AuthenticatedRequest,

    @Param('leadId', new ParseUUIDPipe())
    leadId: string,

    @Body()
    dto: ConvertLeadDto,
  ) {
    return this.leadsFacade.convert(
      request.user.organizationId,

      leadId,

      request.user.sub,

      dto,
    );
  }

  @Post(':leadId/restore')
  restore(
    @Req()
    request: AuthenticatedRequest,

    @Param('leadId', new ParseUUIDPipe())
    leadId: string,
  ) {
    return this.leadsFacade.restore(
      request.user.organizationId,

      leadId,

      request.user.sub,
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

  @Delete(':leadId/permanent')
  @RequirePermissions(PERMISSIONS.CRM_PERMANENT_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  permanentDelete(
    @Req()
    request: AuthenticatedRequest,

    @Param('leadId', new ParseUUIDPipe())
    leadId: string,
  ): Promise<void> {
    return this.leadsFacade.permanentDelete(
      request.user.organizationId,

      leadId,
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
