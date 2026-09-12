import { Module } from '@nestjs/common';

import { EmployeesModule } from '../employees/employees.module';
import { HallBookingsController } from './hall-bookings.controller';
import { HallsController } from './halls.controller';
import { HallsRepository } from './halls.repository';
import { HallsService } from './halls.service';

@Module({
  imports: [EmployeesModule],
  controllers: [HallsController, HallBookingsController],
  providers: [HallsRepository, HallsService],
  exports: [HallsService],
})
export class HallsModule {}
