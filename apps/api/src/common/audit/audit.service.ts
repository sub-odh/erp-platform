import { Injectable } from '@nestjs/common';
import { and, desc, eq, sql, type SQL } from 'drizzle-orm';

import { auditLogs, db, type AuditMetadata } from '@erp/db';

import { createPaginatedResult } from '../pagination';
import type { ListAuditLogsQueryDto } from './dto/list-audit-logs-query.dto';

export interface RecordAuditInput {
  organizationId: string;
  actorUserId: string;
  action: string;
  entityType: string;
  entityId?: string;
  requestMethod: string;
  requestPath: string;
  requestId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata: AuditMetadata;
}

@Injectable()
export class AuditService {
  async list(organizationId: string, query: ListAuditLogsQueryDto) {
    const conditions: SQL[] = [
      eq(auditLogs.organizationId, organizationId),
    ];

    if (query.actorUserId) {
      conditions.push(eq(auditLogs.actorUserId, query.actorUserId));
    }

    if (query.entityType) {
      conditions.push(eq(auditLogs.entityType, query.entityType));
    }

    if (query.action) {
      conditions.push(eq(auditLogs.action, query.action));
    }

    const offset = (query.page - 1) * query.limit;
    const [data, totalResult] = await Promise.all([
      db
        .select()
        .from(auditLogs)
        .where(and(...conditions))
        .orderBy(desc(auditLogs.createdAt))
        .limit(query.limit)
        .offset(offset),
      db
        .select({ total: sql<number>`count(*)::int` })
        .from(auditLogs)
        .where(and(...conditions)),
    ]);

    return createPaginatedResult(
      data,
      query.page,
      query.limit,
      totalResult[0]?.total ?? 0,
    );
  }

  async record(input: RecordAuditInput): Promise<void> {
    await db.insert(auditLogs).values({
      organizationId: input.organizationId,
      actorUserId: input.actorUserId,
      action: input.action,
      entityType: input.entityType,
      requestMethod: input.requestMethod,
      requestPath: input.requestPath,
      metadata: input.metadata,
      ...(input.entityId ? { entityId: input.entityId } : {}),
      ...(input.requestId ? { requestId: input.requestId } : {}),
      ...(input.ipAddress ? { ipAddress: input.ipAddress } : {}),
      ...(input.userAgent ? { userAgent: input.userAgent } : {}),
    });
  }
}
