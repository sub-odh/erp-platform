import { Module } from '@nestjs/common';

import { HolidaysController } from './holidays.controller';
import { HolidaysRepository } from './holidays.repository';
import { HolidaysService } from './holidays.service';

@Module({
  controllers: [HolidaysController],
  providers: [HolidaysRepository, HolidaysService],
  exports: [HolidaysService],
})
export class HolidaysModule {}
