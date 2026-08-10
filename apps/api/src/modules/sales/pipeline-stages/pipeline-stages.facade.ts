import { Injectable } from '@nestjs/common';

import { CreatePipelineStageDto } from './dto/create-pipeline-stage.dto';
import { PipelineStageResponseDto } from './dto/pipeline-stage-response.dto';
import { UpdatePipelineStageDto } from './dto/update-pipeline-stage.dto';
import { PipelineStagesService } from './pipeline-stages.service';

@Injectable()
export class PipelineStagesFacade {
  constructor(private readonly pipelineStagesService: PipelineStagesService) {}

  list(
    tenantId: string,
    actorUserId: string,
  ): Promise<PipelineStageResponseDto[]> {
    return this.pipelineStagesService.list(tenantId, actorUserId);
  }

  findById(
    tenantId: string,
    stageId: string,
  ): Promise<PipelineStageResponseDto> {
    return this.pipelineStagesService.findById(tenantId, stageId);
  }

  create(
    tenantId: string,
    actorUserId: string,
    dto: CreatePipelineStageDto,
  ): Promise<PipelineStageResponseDto> {
    return this.pipelineStagesService.create(tenantId, actorUserId, dto);
  }

  update(
    tenantId: string,
    stageId: string,
    actorUserId: string,
    dto: UpdatePipelineStageDto,
  ): Promise<PipelineStageResponseDto> {
    return this.pipelineStagesService.update(
      tenantId,
      stageId,
      actorUserId,
      dto,
    );
  }

  updateStatus(
    tenantId: string,
    stageId: string,
    actorUserId: string,
    isActive: boolean,
  ): Promise<PipelineStageResponseDto> {
    return this.pipelineStagesService.updateStatus(
      tenantId,
      stageId,
      actorUserId,
      isActive,
    );
  }
}
