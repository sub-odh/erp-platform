import { Module } from '@nestjs/common';

import { SalesOrdersController } from './sales-orders.controller';
import { SalesOrdersRepository } from './sales-orders.repository';
import { SalesOrdersService } from './sales-orders.service';

@Module({
  controllers: [SalesOrdersController],
  providers: [SalesOrdersRepository, SalesOrdersService],
})
export class SalesOrdersModule {}
