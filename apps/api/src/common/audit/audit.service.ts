import { Injectable } from '@nestjs/common';
import { and, desc, eq, ilike, or, sql, type SQL } from 'drizzle-orm';

import {
  auditLogs,
  db,
  hrEmployees,
  inventoryMovements,
  notificationEmailOutbox,
  users,
  type AuditMetadata,
} from '@erp/db';

import { createPaginatedResult } from '../pagination';
import type {
  ListAuditLogsQueryDto,
  ListLogLedgerQueryDto,
  LogTab,
} from './dto/list-audit-logs-query.dto';

export interface LogLedgerRow {
  id: string;
  timestamp: string;
  userName: string | null;
  designation: string | null;
  photoUrl: string | null;
  action: string;
  details: string | null;
  ipAddress: string | null;
  recipient: string | null;
  subject: string | null;
  qtyChange: number | null;
}

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

  async ledger(organizationId: string, query: ListLogLedgerQueryDto) {
    const tab = query.tab;
    const search = query.search?.trim() ?? '';
    const pattern = search ? `%${search.replace(/[%_\\]/g, '')}%` : null;
    const offset = (query.page - 1) * query.limit;

    if (tab === 'inventory') {
      return this.inventoryLedger(organizationId, pattern, query.page, query.limit, offset);
    }

    if (tab === 'mail') {
      return this.mailLedger(organizationId, pattern, query.page, query.limit, offset);
    }

    const result = await this.auditLedger(
      organizationId,
      tab,
      pattern,
      query.page,
      query.limit,
      offset,
    );
    return { ...result, tab };
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

  private async auditLedger(
    organizationId: string,
    tab: LogTab,
    pattern: string | null,
    page: number,
    limit: number,
    offset: number,
  ) {
    const conditions: SQL[] = [eq(auditLogs.organizationId, organizationId)];

    if (tab === 'system') {
      conditions.push(
        sql`coalesce((${auditLogs.metadata}->>'responseStatus')::int, 200) >= 400`,
      );
    }

    if (pattern) {
      const search = or(
        ilike(auditLogs.action, pattern),
        ilike(auditLogs.requestPath, pattern),
        ilike(auditLogs.entityType, pattern),
        ilike(auditLogs.ipAddress, pattern),
        ilike(users.firstName, pattern),
        ilike(users.lastName, pattern),
        ilike(hrEmployees.firstName, pattern),
        ilike(hrEmployees.lastName, pattern),
      );
      if (search) conditions.push(search);
    }

    const where = and(...conditions);
    const [rows, totalResult] = await Promise.all([
      db
        .select({
          id: auditLogs.id,
          createdAt: auditLogs.createdAt,
          action: auditLogs.action,
          requestMethod: auditLogs.requestMethod,
          requestPath: auditLogs.requestPath,
          entityType: auditLogs.entityType,
          ipAddress: auditLogs.ipAddress,
          userFirst: users.firstName,
          userLast: users.lastName,
          employeeFirst: hrEmployees.firstName,
          employeeLast: hrEmployees.lastName,
          designation: hrEmployees.designation,
          photoUrl: hrEmployees.photoUrl,
        })
        .from(auditLogs)
        .leftJoin(users, eq(users.id, auditLogs.actorUserId))
        .leftJoin(hrEmployees, eq(hrEmployees.userId, auditLogs.actorUserId))
        .where(where)
        .orderBy(desc(auditLogs.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ total: sql<number>`count(*)::int` })
        .from(auditLogs)
        .leftJoin(users, eq(users.id, auditLogs.actorUserId))
        .leftJoin(hrEmployees, eq(hrEmployees.userId, auditLogs.actorUserId))
        .where(where),
    ]);

    return this.pageRows(
      tab,
      rows.map((row) => ({
        id: row.id,
        timestamp: formatLogTime(row.createdAt),
        userName: personName(
          row.employeeFirst,
          row.employeeLast,
          row.userFirst,
          row.userLast,
        ),
        designation: row.designation,
        photoUrl: row.photoUrl,
        action: verbFromMethod(row.requestMethod, row.action),
        details: `${row.action} · ${row.entityType} · ${row.requestPath}`,
        ipAddress: row.ipAddress ?? '127.0.0.1',
        recipient: null,
        subject: null,
        qtyChange: null,
      })),
      page,
      limit,
      totalResult[0]?.total ?? 0,
    );
  }

  private async inventoryLedger(
    organizationId: string,
    pattern: string | null,
    page: number,
    limit: number,
    offset: number,
  ) {
    const conditions: SQL[] = [
      eq(inventoryMovements.tenantId, organizationId),
    ];

    if (pattern) {
      const search = or(
        ilike(inventoryMovements.remarks, pattern),
        sql`cast(${inventoryMovements.type} as text) ilike ${pattern}`,
        ilike(users.firstName, pattern),
        ilike(users.lastName, pattern),
        ilike(hrEmployees.firstName, pattern),
        ilike(hrEmployees.lastName, pattern),
      );
      if (search) conditions.push(search);
    }

    const where = and(...conditions);
    const [rows, totalResult] = await Promise.all([
      db
        .select({
          id: inventoryMovements.id,
          createdAt: inventoryMovements.createdAt,
          type: inventoryMovements.type,
          remarks: inventoryMovements.remarks,
          quantityDelta: inventoryMovements.quantityDelta,
          userFirst: users.firstName,
          userLast: users.lastName,
          employeeFirst: hrEmployees.firstName,
          employeeLast: hrEmployees.lastName,
          designation: hrEmployees.designation,
          photoUrl: hrEmployees.photoUrl,
        })
        .from(inventoryMovements)
        .leftJoin(users, eq(users.id, inventoryMovements.performedBy))
        .leftJoin(
          hrEmployees,
          eq(hrEmployees.userId, inventoryMovements.performedBy),
        )
        .where(where)
        .orderBy(desc(inventoryMovements.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ total: sql<number>`count(*)::int` })
        .from(inventoryMovements)
        .leftJoin(users, eq(users.id, inventoryMovements.performedBy))
        .leftJoin(
          hrEmployees,
          eq(hrEmployees.userId, inventoryMovements.performedBy),
        )
        .where(where),
    ]);

    return this.pageRows(
      'inventory',
      rows.map((row) => ({
        id: row.id,
        timestamp: formatLogTime(row.createdAt),
        userName: personName(
          row.employeeFirst,
          row.employeeLast,
          row.userFirst,
          row.userLast,
        ),
        designation: row.designation,
        photoUrl: row.photoUrl,
        action: row.type,
        details: row.remarks,
        ipAddress: null,
        recipient: null,
        subject: null,
        qtyChange: row.quantityDelta,
      })),
      page,
      limit,
      totalResult[0]?.total ?? 0,
    );
  }

  private async mailLedger(
    organizationId: string,
    pattern: string | null,
    page: number,
    limit: number,
    offset: number,
  ) {
    const conditions: SQL[] = [
      eq(notificationEmailOutbox.organizationId, organizationId),
    ];

    if (pattern) {
      const search = or(
        ilike(notificationEmailOutbox.subject, pattern),
        ilike(notificationEmailOutbox.recipientEmail, pattern),
        ilike(notificationEmailOutbox.status, pattern),
        ilike(notificationEmailOutbox.lastError, pattern),
      );
      if (search) conditions.push(search);
    }

    const where = and(...conditions);
    const [rows, totalResult] = await Promise.all([
      db
        .select({
          id: notificationEmailOutbox.id,
          createdAt: notificationEmailOutbox.createdAt,
          sentAt: notificationEmailOutbox.sentAt,
          recipient: notificationEmailOutbox.recipientEmail,
          subject: notificationEmailOutbox.subject,
          status: notificationEmailOutbox.status,
          lastError: notificationEmailOutbox.lastError,
        })
        .from(notificationEmailOutbox)
        .where(where)
        .orderBy(desc(notificationEmailOutbox.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ total: sql<number>`count(*)::int` })
        .from(notificationEmailOutbox)
        .where(where),
    ]);

    return this.pageRows(
      'mail',
      rows.map((row) => ({
        id: row.id,
        timestamp: formatLogTime(row.sentAt ?? row.createdAt),
        userName: null,
        designation: null,
        photoUrl: null,
        action: row.status,
        details: row.lastError,
        ipAddress: null,
        recipient: row.recipient,
        subject: row.subject,
        qtyChange: null,
      })),
      page,
      limit,
      totalResult[0]?.total ?? 0,
    );
  }

  private pageRows(
    tab: LogTab,
    data: LogLedgerRow[],
    page: number,
    limit: number,
    total: number,
  ) {
    const paged = createPaginatedResult(data, page, limit, total);
    return {
      tab,
      total,
      page,
      totalPages: Math.max(paged.pagination.totalPages, 1),
      rows: data,
    };
  }
}

function personName(
  employeeFirst: string | null,
  employeeLast: string | null,
  userFirst: string | null,
  userLast: string | null,
): string | null {
  const employee = [employeeFirst, employeeLast].filter(Boolean).join(' ').trim();
  if (employee) return employee;
  const user = [userFirst, userLast].filter(Boolean).join(' ').trim();
  return user || null;
}

function verbFromMethod(method: string, action: string): string {
  if (method === 'POST') return 'CREATE';
  if (method === 'PATCH' || method === 'PUT') return 'UPDATE';
  if (method === 'DELETE') return 'DELETE';
  return action.toUpperCase();
}

function formatLogTime(value: Date | null): string {
  if (!value) return '-';
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kathmandu',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).formatToParts(value);
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';
  const hour = pick('hour').replace(/^0/, '');
  return `${pick('day')} ${pick('month')}, ${pick('year')} ${hour}:${pick('minute')} ${pick('dayPeriod').toUpperCase()}`;
}
