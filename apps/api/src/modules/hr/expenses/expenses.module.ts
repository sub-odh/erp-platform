import { Module } from '@nestjs/common';

import { EmployeesModule } from '../employees/employees.module';
import { ExpensesController } from './expenses.controller';
import { ExpensesRepository } from './expenses.repository';
import { ExpensesService } from './expenses.service';

@Module({
  imports: [EmployeesModule],
  controllers: [ExpensesController],
  providers: [ExpensesRepository, ExpensesService],
  exports: [ExpensesService],
})
export class ExpensesModule {}
