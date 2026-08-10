import { Module } from '@nestjs/common';

import { PipelineStagesController } from './pipeline-stages.controller';
import { PipelineStagesFacade } from './pipeline-stages.facade';
import { PipelineStagesRepository } from './pipeline-stages.repository';
import { PipelineStagesService } from './pipeline-stages.service';

@Module({
  controllers: [PipelineStagesController],

  providers: [
    PipelineStagesRepository,
    PipelineStagesService,
    PipelineStagesFacade,
  ],

  exports: [PipelineStagesFacade],
})
export class PipelineStagesModule {}
