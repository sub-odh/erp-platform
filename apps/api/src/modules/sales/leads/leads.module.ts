import { Module } from '@nestjs/common';

import { LeadsController } from './leads.controller';
import { LeadsFacade } from './leads.facade';
import { LeadsRepository } from './leads.repository';
import { LeadsService } from './leads.service';

@Module({
  controllers: [LeadsController],

  providers: [LeadsRepository, LeadsService, LeadsFacade],

  exports: [LeadsFacade],
})
export class LeadsModule {}
