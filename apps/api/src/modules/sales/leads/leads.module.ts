import { Module } from '@nestjs/common';

import { LeadsController } from './leads.controller';
import { LeadsFacade } from './leads.facade';
import { LeadsRepository } from './leads.repository';
import { LeadsService } from './leads.service';
import { PipelineRepository } from './pipeline.repository';
import { PipelineService } from './pipeline.service';

@Module({
  controllers: [LeadsController],

  providers: [
    LeadsRepository,
    LeadsService,
    LeadsFacade,
    PipelineRepository,
    PipelineService,
  ],

  exports: [LeadsFacade],
})
export class LeadsModule {}
