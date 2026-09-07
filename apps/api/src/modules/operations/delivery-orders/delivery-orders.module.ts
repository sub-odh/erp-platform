import { Module } from '@nestjs/common';

import { DeliveryOrdersController } from './delivery-orders.controller';
import { DeliveryOrdersRepository } from './delivery-orders.repository';
import { DeliveryOrdersService } from './delivery-orders.service';

@Module({
  controllers: [DeliveryOrdersController],
  providers: [DeliveryOrdersRepository, DeliveryOrdersService],
})
export class DeliveryOrdersModule {}
