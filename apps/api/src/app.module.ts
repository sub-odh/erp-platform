import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';

import { env } from '@erp/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuditInterceptor } from './common/audit/audit.interceptor';
import { AuditModule } from './common/audit/audit.module';
import { LicensingModule } from './common/licensing/licensing.module';
import { TenantContextInterceptor } from './common/tenant';

import { AuthModule } from './modules/auth/auth.module';
import { AuthorizationModule } from './modules/auth/permissions/authorization.module';
import { MediaModule } from './modules/media/media.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SmtpModule } from './modules/smtp/smtp.module';
import { CompanyModule } from './modules/company/company.module';

import { CustomersModule } from './modules/sales/customers/customers.module';
import { LeadsModule } from './modules/sales/leads/leads.module';
import { OpportunitiesModule } from './modules/sales/opportunities/opportunities.module';
import { QuotationsModule } from './modules/sales/quotations/quotations.module';
import { SalesOrdersModule } from './modules/sales/sales-orders/sales-orders.module';
import { PipelineStagesModule } from './modules/sales/pipeline-stages/pipeline-stages.module';
import { InventoryModule } from './modules/operations/inventory/inventory.module';
import { MasterDataModule } from './modules/operations/master-data/master-data.module';
import { PurchaseOrdersModule } from './modules/operations/purchase-orders/purchase-orders.module';
import { GoodsReceiptsModule } from './modules/operations/goods-receipts/goods-receipts.module';
import { DeliveryOrdersModule } from './modules/operations/delivery-orders/delivery-orders.module';
import { ItemReturnsModule } from './modules/operations/item-returns/item-returns.module';
import { InvoicesModule } from './modules/finance/invoices/invoices.module';
import { ProcurementModule } from './modules/procurement/procurement.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';

import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: true,
      load: [() => env],
    }),

    LoggerModule.forRoot({
      pinoHttp: {
        level: env.NODE_ENV === 'production' ? 'info' : 'debug',

        transport:
          env.NODE_ENV === 'development'
            ? {
                target: 'pino-pretty',

                options: {
                  colorize: true,

                  translateTime: 'SYS:standard',

                  singleLine: true,
                },
              }
            : undefined,
      },
    }),

    LicensingModule,
    AuditModule,

    AuthorizationModule,

    NotificationsModule,

    SmtpModule,

    AuthModule,

    UsersModule,

    CustomersModule,

    PipelineStagesModule,

    LeadsModule,

    OpportunitiesModule,

    QuotationsModule,

    SalesOrdersModule,

    InventoryModule,

    MasterDataModule,

    PurchaseOrdersModule,

    GoodsReceiptsModule,

    DeliveryOrdersModule,

    ItemReturnsModule,

    InvoicesModule,

    ProcurementModule,

    DashboardModule,

    CompanyModule,

    MediaModule,
  ],

  controllers: [AppController],

  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantContextInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}
