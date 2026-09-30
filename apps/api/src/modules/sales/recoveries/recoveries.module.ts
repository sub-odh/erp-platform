import { Module } from '@nestjs/common';

import { SmtpModule } from '../../smtp/smtp.module';
import { RecoveriesController } from './recoveries.controller';
import { RecoveriesRepository } from './recoveries.repository';
import { RecoveriesService } from './recoveries.service';

@Module({
  imports: [SmtpModule],
  controllers: [RecoveriesController],
  providers: [RecoveriesRepository, RecoveriesService],
})
export class RecoveriesModule {}
