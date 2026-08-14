import { Global, Module } from '@nestjs/common';

import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationEmailOutboxService } from './notification-email-outbox.service';
import { SmtpModule } from '../smtp/smtp.module';

@Global()
@Module({
  imports: [SmtpModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationEmailOutboxService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
