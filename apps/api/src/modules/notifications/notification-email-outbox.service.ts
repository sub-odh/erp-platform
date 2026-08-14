import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { and, asc, eq, lte } from 'drizzle-orm';

import { env } from '@erp/config';
import {
  db,
  notificationEmailOutbox,
  organizations,
  withTenantContext,
  type NotificationEmailOutbox,
} from '@erp/db';
import { SmtpService } from '../smtp/smtp.service';

const MAX_ATTEMPTS = 5;

@Injectable()
export class NotificationEmailOutboxService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(NotificationEmailOutboxService.name);
  private timer?: NodeJS.Timeout;
  private processing = false;

  constructor(private readonly smtp: SmtpService) {}

  onModuleInit(): void {
    if (env.EMAIL_DELIVERY_MODE === 'disabled') {
      this.logger.warn(
        'Email delivery is disabled; notifications remain queued',
      );
      return;
    }
    this.timer = setInterval(() => void this.processAllTenants(), 60_000);
    this.timer.unref();
    void this.processAllTenants();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  async processAllTenants(): Promise<void> {
    if (this.processing) return;
    this.processing = true;
    try {
      const tenantRows = await db
        .select({ id: organizations.id })
        .from(organizations);
      for (const tenant of tenantRows) {
        await withTenantContext(tenant.id, () => this.processTenant(tenant.id));
      }
    } finally {
      this.processing = false;
    }
  }

  private async processTenant(organizationId: string): Promise<void> {
    if (
      env.EMAIL_DELIVERY_MODE === 'smtp' &&
      !(await this.smtp.hasActiveConfiguration(organizationId))
    ) {
      return;
    }

    const items = await db
      .select()
      .from(notificationEmailOutbox)
      .where(
        and(
          eq(notificationEmailOutbox.organizationId, organizationId),
          eq(notificationEmailOutbox.status, 'PENDING'),
          lte(notificationEmailOutbox.nextAttemptAt, new Date()),
        ),
      )
      .orderBy(asc(notificationEmailOutbox.createdAt))
      .limit(20);

    for (const item of items) await this.deliver(item);
  }

  private async deliver(item: NotificationEmailOutbox): Promise<void> {
    try {
      if (env.EMAIL_DELIVERY_MODE === 'log') {
        this.logger.log(`Email to ${item.recipientEmail}: ${item.subject}`);
      } else {
        await this.smtp.send(item.organizationId, {
          to: item.recipientEmail,
          subject: item.subject,
          text: item.body,
        });
      }
      await db
        .update(notificationEmailOutbox)
        .set({ status: 'SENT', sentAt: new Date(), updatedAt: new Date() })
        .where(eq(notificationEmailOutbox.id, item.id));
    } catch (error: unknown) {
      const attempts = item.attempts + 1;
      const delayMinutes = Math.min(60, 2 ** attempts);
      await db
        .update(notificationEmailOutbox)
        .set({
          status: attempts >= MAX_ATTEMPTS ? 'FAILED' : 'PENDING',
          attempts,
          nextAttemptAt: new Date(Date.now() + delayMinutes * 60_000),
          lastError:
            error instanceof Error
              ? error.message.slice(0, 1000)
              : 'Unknown delivery error',
          updatedAt: new Date(),
        })
        .where(eq(notificationEmailOutbox.id, item.id));
    }
  }
}
