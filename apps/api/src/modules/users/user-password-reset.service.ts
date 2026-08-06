import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { hash } from 'bcrypt';
import { randomInt } from 'node:crypto';
import { and, eq, isNull, sql } from 'drizzle-orm';

import { authSessions, db, users, type User } from '@erp/db';

import { ResetUserPasswordResponseDto } from './dto/reset-user-password-response.dto';

function canManageUser(
  actorRole: User['role'],
  targetRole: User['role'],
): boolean {
  if (actorRole === 'OWNER') {
    return targetRole !== 'OWNER';
  }

  if (actorRole === 'ADMIN') {
    return targetRole === 'MANAGER' || targetRole === 'STAFF';
  }

  return false;
}

function pickRandomCharacter(characters: string): string {
  return characters[randomInt(0, characters.length)]!;
}

function shuffleCharacters(characters: string[]): string {
  for (let index = characters.length - 1; index > 0; index -= 1) {
    const randomIndex = randomInt(0, index + 1);

    [characters[index], characters[randomIndex]] = [
      characters[randomIndex]!,
      characters[index]!,
    ];
  }

  return characters.join('');
}

function generateTemporaryPassword(length = 18): string {
  const lowercase = 'abcdefghijkmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const numbers = '23456789';
  const symbols = '!@#$%&*+-=?';
  const allCharacters = lowercase + uppercase + numbers + symbols;

  const characters = [
    pickRandomCharacter(lowercase),
    pickRandomCharacter(uppercase),
    pickRandomCharacter(numbers),
    pickRandomCharacter(symbols),
  ];

  while (characters.length < length) {
    characters.push(pickRandomCharacter(allCharacters));
  }

  return shuffleCharacters(characters);
}

@Injectable()
export class UserPasswordResetService {
  async resetPassword(
    organizationId: string,
    actorUserId: string,
    actorRole: User['role'],
    targetUserId: string,
  ): Promise<ResetUserPasswordResponseDto> {
    if (actorUserId === targetUserId) {
      throw new ForbiddenException(
        'Use the change-password endpoint to change your own password',
      );
    }

    const [targetUser] = await db
      .select({
        id: users.id,
        role: users.role,
      })
      .from(users)
      .where(
        and(
          eq(users.id, targetUserId),
          eq(users.organizationId, organizationId),
          isNull(users.deletedAt),
        ),
      )
      .limit(1);

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    if (!canManageUser(actorRole, targetUser.role)) {
      throw new ForbiddenException(
        `Role ${actorRole} cannot reset the password of a ${targetUser.role} user`,
      );
    }

    const temporaryPassword = generateTemporaryPassword();

    const passwordHash = await hash(temporaryPassword, 12);

    await db.transaction(async (transaction) => {
      const [updatedUser] = await transaction
        .update(users)
        .set({
          passwordHash,
          mustChangePassword: true,
          passwordChangedAt: null,
          tokenVersion: sql`${users.tokenVersion} + 1`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(users.id, targetUserId),
            eq(users.organizationId, organizationId),
            isNull(users.deletedAt),
          ),
        )
        .returning({
          id: users.id,
        });

      if (!updatedUser) {
        throw new NotFoundException('User not found');
      }

      await transaction
        .update(authSessions)
        .set({
          revokedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(authSessions.userId, targetUserId),
            isNull(authSessions.revokedAt),
          ),
        );
    });

    return {
      userId: targetUserId,
      temporaryPassword,
      mustChangePassword: true,
    };
  }
}
