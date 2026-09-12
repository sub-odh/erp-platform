import { Module } from '@nestjs/common';

import { MediaModule } from '../../media/media.module';
import { EmployeesModule } from '../employees/employees.module';
import { PartnersController } from './partners.controller';
import { PartnersRepository } from './partners.repository';
import { PartnersService } from './partners.service';

@Module({
  imports: [EmployeesModule, MediaModule],
  controllers: [PartnersController],
  providers: [PartnersRepository, PartnersService],
  exports: [PartnersService],
})
export class PartnersModule {}
