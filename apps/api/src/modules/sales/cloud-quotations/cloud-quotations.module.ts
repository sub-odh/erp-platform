import { Module } from '@nestjs/common';

import { CloudQuotationsController } from './cloud-quotations.controller';
import { CloudQuotationsRepository } from './cloud-quotations.repository';
import { CloudQuotationsService } from './cloud-quotations.service';

@Module({
  controllers: [CloudQuotationsController],
  providers: [CloudQuotationsRepository, CloudQuotationsService],
})
export class CloudQuotationsModule {}
