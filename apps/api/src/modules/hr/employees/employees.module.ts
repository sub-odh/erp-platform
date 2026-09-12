import { Module } from '@nestjs/common';

import { MediaModule } from '../../media/media.module';
import { EmployeesController } from './employees.controller';
import { EmployeesRepository } from './employees.repository';
import { EmployeesService } from './employees.service';

@Module({
  imports: [MediaModule],
  controllers: [EmployeesController],
  providers: [EmployeesRepository, EmployeesService],
  exports: [EmployeesService, EmployeesRepository],
})
export class EmployeesModule {}
