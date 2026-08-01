import { Injectable } from '@nestjs/common';
import { and, eq, gt, isNull } from 'drizzle-orm';

import { authSessions, db } from '@erp/db';

interface CreateSessionInput {
  id: string;
  userId: string;
  refreshTokenHash: string;
  expiresAt: Date;
}

interface RotateSessionInput {
  sessionId: string;
  userId: string;
  currentTokenHash: string;
  nextTokenHash: string;
  nextExpiresAt: Date;
}

interface RevokeSessionInput {
  sessionId: string;
  userId: string;
  refreshTokenHash: string;
}

@Injectable()
export class AuthSessionsService {
  async createSession(input: CreateSessionInput): Promise<void> {
    await db.insert(authSessions).values({
      id: input.id,
      userId: input.userId,
      refreshTokenHash: input.refreshTokenHash,
      expiresAt: input.expiresAt,
    });
  }

  async rotateSession(input: RotateSessionInput): Promise<boolean> {
    const [updatedSession] = await db
      .update(authSessions)
      .set({
        refreshTokenHash: input.nextTokenHash,
        expiresAt: input.nextExpiresAt,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(authSessions.id, input.sessionId),
          eq(authSessions.userId, input.userId),
          eq(authSessions.refreshTokenHash, input.currentTokenHash),
          isNull(authSessions.revokedAt),
          gt(authSessions.expiresAt, new Date()),
        ),
      )
      .returning({
        id: authSessions.id,
      });

    return Boolean(updatedSession);
  }

  async revokeSession(input: RevokeSessionInput): Promise<boolean> {
    const [revokedSession] = await db
      .update(authSessions)
      .set({
        revokedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(authSessions.id, input.sessionId),
          eq(authSessions.userId, input.userId),
          eq(authSessions.refreshTokenHash, input.refreshTokenHash),
          isNull(authSessions.revokedAt),
          gt(authSessions.expiresAt, new Date()),
        ),
      )
      .returning({
        id: authSessions.id,
      });

    return Boolean(revokedSession);
  }

  async revokeAllSessions(userId: string): Promise<void> {
    await db
      .update(authSessions)
      .set({
        revokedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(eq(authSessions.userId, userId), isNull(authSessions.revokedAt)),
      );
  }
}
