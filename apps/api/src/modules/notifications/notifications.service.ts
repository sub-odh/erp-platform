import { Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq, isNull, sql } from 'drizzle-orm';

import {
  db,
  notificationEmailOutbox,
  notifications,
  users,
  type NewNotification,
  type NotificationMetadata,
} from '@erp/db';

import { createPaginatedResult } from '../../common/pagination';
import type { ListNotificationsQueryDto } from './dto/list-notifications-query.dto';

export interface CreateNotificationInput {
  organizationId: string;
  recipientUserId: string;
  actorUserId?: string;
  type: string;
  title: string;
  message: string;
  actionUrl?: string;
  entityType?: string;
  entityId?: string;
  metadata?: NotificationMetadata;
  queueEmail?: boolean;
}

@Injectable()
export class NotificationsService {
  async list(
    organizationId: string,
    userId: string,
    query: ListNotificationsQueryDto,
  ) {
    const conditions = [
      eq(notifications.organizationId, organizationId),
      eq(notifications.recipientUserId, userId),
    ];
    if (query.unreadOnly) conditions.push(isNull(notifications.readAt));

    const where = and(...conditions);
    const [data, [{ total = 0 } = {}]] = await Promise.all([
      db
        .select()
        .from(notifications)
        .where(where)
        .orderBy(desc(notifications.createdAt))
        .limit(query.limit)
        .offset((query.page - 1) * query.limit),
      db
        .select({ total: sql<number>`count(*)::int` })
        .from(notifications)
        .where(where),
    ]);

    return createPaginatedResult(data, query.page, query.limit, total);
  }

  async unreadCount(organizationId: string, userId: string) {
    const [{ count = 0 } = {}] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(
        and(
          eq(notifications.organizationId, organizationId),
          eq(notifications.recipientUserId, userId),
          isNull(notifications.readAt),
        ),
      );
    return { count };
  }

  async markRead(organizationId: string, userId: string, id: string) {
    const [notification] = await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(notifications.id, id),
          eq(notifications.organizationId, organizationId),
          eq(notifications.recipientUserId, userId),
        ),
      )
      .returning();

    if (!notification) throw new NotFoundException('Notification not found');
    return notification;
  }

  async markAllRead(organizationId: string, userId: string) {
    await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(notifications.organizationId, organizationId),
          eq(notifications.recipientUserId, userId),
          isNull(notifications.readAt),
        ),
      );
  }

  async notify(input: CreateNotificationInput): Promise<void> {
    if (input.recipientUserId === input.actorUserId) return;

    const [recipient] = await db
      .select({ email: users.email })
      .from(users)
      .where(
        and(
          eq(users.id, input.recipientUserId),
          eq(users.organizationId, input.organizationId),
          eq(users.isActive, true),
          isNull(users.deletedAt),
        ),
      )
      .limit(1);
    if (!recipient) return;

    const value: NewNotification = {
      organizationId: input.organizationId,
      recipientUserId: input.recipientUserId,
      actorUserId: input.actorUserId,
      type: input.type,
      title: input.title,
      message: input.message,
      actionUrl: input.actionUrl,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: input.metadata ?? {},
    };
    const [created] = await db.insert(notifications).values(value).returning();

    if (created && input.queueEmail !== false) {
      await db.insert(notificationEmailOutbox).values({
        organizationId: input.organizationId,
        notificationId: created.id,
        recipientEmail: recipient.email,
        subject: input.title,
        body: input.message,
      });
    }
  }
}
