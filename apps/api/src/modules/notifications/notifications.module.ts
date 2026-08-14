import { Global, Module } from '@nestjs/common';

import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationEmailOutboxService } from './notification-email-outbox.service';

@Global()
@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationEmailOutboxService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
