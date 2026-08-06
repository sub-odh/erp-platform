import { Module } from '@nestjs/common';

import { CustomersController } from './customers.controller';
import { CustomersFacade } from './customers.facade';
import { CustomersRepository } from './customers.repository';
import { CustomersService } from './customers.service';

@Module({
  controllers: [CustomersController],
  providers: [CustomersRepository, CustomersService, CustomersFacade],
  exports: [CustomersFacade],
})
export class CustomersModule {}
