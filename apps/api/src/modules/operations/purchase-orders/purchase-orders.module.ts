import { Module } from '@nestjs/common';

import { CompanyModule } from '../../company/company.module';
import { SmtpModule } from '../../smtp/smtp.module';
import { PurchaseOrdersController } from './purchase-orders.controller';
import { PurchaseOrdersRepository } from './purchase-orders.repository';
import { PurchaseOrdersService } from './purchase-orders.service';

@Module({
  imports: [CompanyModule, SmtpModule],
  controllers: [PurchaseOrdersController],
  providers: [PurchaseOrdersRepository, PurchaseOrdersService],
})
export class PurchaseOrdersModule {}
