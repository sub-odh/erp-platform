import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import type { Request } from 'express';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../../auth/types/jwt-payload.type';

import { CreatePipelineStageDto } from './dto/create-pipeline-stage.dto';
import { UpdatePipelineStageDto } from './dto/update-pipeline-stage.dto';
import { UpdatePipelineStageStatusDto } from './dto/update-pipeline-stage-status.dto';
import { PipelineStagesFacade } from './pipeline-stages.facade';

type AuthenticatedRequest = Request & {
  user: JwtPayload;
};

@Controller({
  path: 'sales/pipeline-stages',
  version: '1',
})
@UseGuards(JwtAuthGuard)
export class PipelineStagesController {
  constructor(private readonly pipelineStagesFacade: PipelineStagesFacade) {}

  @Get()
  list(
    @Req()
    request: AuthenticatedRequest,
  ) {
    return this.pipelineStagesFacade.list(
      request.user.organizationId,
      request.user.sub,
    );
  }

  @Get(':stageId')
  findById(
    @Req()
    request: AuthenticatedRequest,

    @Param('stageId', new ParseUUIDPipe())
    stageId: string,
  ) {
    return this.pipelineStagesFacade.findById(
      request.user.organizationId,
      stageId,
    );
  }

  @Post()
  create(
    @Req()
    request: AuthenticatedRequest,

    @Body()
    dto: CreatePipelineStageDto,
  ) {
    return this.pipelineStagesFacade.create(
      request.user.organizationId,
      request.user.sub,
      dto,
    );
  }

  @Patch(':stageId')
  update(
    @Req()
    request: AuthenticatedRequest,

    @Param('stageId', new ParseUUIDPipe())
    stageId: string,

    @Body()
    dto: UpdatePipelineStageDto,
  ) {
    return this.pipelineStagesFacade.update(
      request.user.organizationId,
      stageId,
      request.user.sub,
      dto,
    );
  }

  @Patch(':stageId/status')
  updateStatus(
    @Req()
    request: AuthenticatedRequest,

    @Param('stageId', new ParseUUIDPipe())
    stageId: string,

    @Body()
    dto: UpdatePipelineStageStatusDto,
  ) {
    return this.pipelineStagesFacade.updateStatus(
      request.user.organizationId,
      stageId,
      request.user.sub,
      dto.isActive,
    );
  }
}
