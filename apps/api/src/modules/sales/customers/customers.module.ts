import { Module } from '@nestjs/common';

import { CustomerContactsController } from './contacts/customer-contacts.controller';
import { CustomerContactsFacade } from './contacts/customer-contacts.facade';
import { CustomerContactsRepository } from './contacts/customer-contacts.repository';
import { CustomerContactsService } from './contacts/customer-contacts.service';

import { CustomersController } from './customers.controller';
import { CustomersFacade } from './customers.facade';
import { CustomersRepository } from './customers.repository';
import { CustomersService } from './customers.service';

@Module({
  controllers: [CustomersController, CustomerContactsController],

  providers: [
    CustomersRepository,
    CustomersService,
    CustomersFacade,

    CustomerContactsRepository,
    CustomerContactsService,
    CustomerContactsFacade,
  ],

  exports: [CustomersFacade, CustomerContactsFacade],
})
export class CustomersModule {}
