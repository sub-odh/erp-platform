import { Module } from '@nestjs/common';

import { CompanyModule } from '../../company/company.module';
import { SmtpModule } from '../../smtp/smtp.module';
import { ProformaInvoicesController } from './proforma-invoices.controller';
import { ProformaInvoicesRepository } from './proforma-invoices.repository';
import { ProformaInvoicesService } from './proforma-invoices.service';

@Module({
  imports: [CompanyModule, SmtpModule],
  controllers: [ProformaInvoicesController],
  providers: [ProformaInvoicesRepository, ProformaInvoicesService],
})
export class ProformaInvoicesModule {}
