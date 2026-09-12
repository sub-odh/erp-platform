import { Module } from '@nestjs/common';

import { EmployeesModule } from '../employees/employees.module';
import { LeavesController } from './leaves.controller';
import { LeavesRepository } from './leaves.repository';
import { LeavesService } from './leaves.service';

@Module({
  imports: [EmployeesModule],
  controllers: [LeavesController],
  providers: [LeavesRepository, LeavesService],
  exports: [LeavesService],
})
export class LeavesModule {}
