import { Module } from '@nestjs/common';

import { OpportunitiesController } from './opportunities.controller';
import { OpportunitiesFacade } from './opportunities.facade';
import { OpportunitiesRepository } from './opportunities.repository';
import { OpportunitiesService } from './opportunities.service';

@Module({
  controllers: [OpportunitiesController],

  providers: [
    OpportunitiesRepository,
    OpportunitiesService,
    OpportunitiesFacade,
  ],

  exports: [OpportunitiesFacade],
})
export class OpportunitiesModule {}
