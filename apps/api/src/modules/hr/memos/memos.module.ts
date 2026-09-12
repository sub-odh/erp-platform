import { Module } from '@nestjs/common';

import { MediaModule } from '../../media/media.module';
import { EmployeesModule } from '../employees/employees.module';
import { MemosController } from './memos.controller';
import { MemosRepository } from './memos.repository';
import { MemosService } from './memos.service';

@Module({
  imports: [EmployeesModule, MediaModule],
  controllers: [MemosController],
  providers: [MemosRepository, MemosService],
  exports: [MemosService],
})
export class MemosModule {}
