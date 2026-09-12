import { Module } from '@nestjs/common';

import { EmployeesModule } from '../employees/employees.module';
import { FuelController } from './fuel.controller';
import { FuelRepository } from './fuel.repository';
import { FuelService } from './fuel.service';

@Module({
  imports: [EmployeesModule],
  controllers: [FuelController],
  providers: [FuelRepository, FuelService],
  exports: [FuelService],
})
export class FuelModule {}
