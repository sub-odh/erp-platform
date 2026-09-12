import { Module } from '@nestjs/common';

import { CustomersModule } from '../../sales/customers/customers.module';
import { EmployeesModule } from '../employees/employees.module';
import { FieldVisitsController } from './field-visits.controller';
import { SupportVisitsController } from './support-visits.controller';
import { VisitsRepository } from './visits.repository';
import { VisitsService } from './visits.service';

@Module({
  imports: [EmployeesModule, CustomersModule],
  controllers: [SupportVisitsController, FieldVisitsController],
  providers: [VisitsRepository, VisitsService],
  exports: [VisitsService],
})
export class VisitsModule {}
