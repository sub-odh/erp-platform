import { Module } from '@nestjs/common';

import { MediaModule } from '../media/media.module';
import { UsersModule } from '../users/users.module';
import { CompanyController } from './company.controller';
import { CompanyDataService } from './company-data.service';
import { CompanyService } from './company.service';

@Module({
  imports: [MediaModule, UsersModule],
  controllers: [CompanyController],
  providers: [CompanyService, CompanyDataService],
  exports: [CompanyService],
})
export class CompanyModule {}
