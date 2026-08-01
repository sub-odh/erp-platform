import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { hash } from 'bcrypt';
import { and, asc, eq, sql } from 'drizzle-orm';

import { db, organizations, users, type User } from '@erp/db';

import type { AssignableUserRole, CreateUserDto } from './dto/create-user.dto';

export type PublicUser = Pick<
  User,
  | 'id'
  | 'organizationId'
  | 'email'
  | 'firstName'
  | 'lastName'
  | 'role'
  | 'isActive'
  | 'createdAt'
>;

function canAssignRole(
  actorRole: User['role'],
  targetRole: AssignableUserRole,
): boolean {
  if (actorRole === 'OWNER') {
    return true;
  }

  if (actorRole === 'ADMIN') {
    return targetRole === 'MANAGER' || targetRole === 'STAFF';
  }

  return false;
}

function canManageUser(
  actorRole: User['role'],
  targetRole: User['role'],
): boolean {
  if (actorRole === 'OWNER') {
    return true;
  }

  if (actorRole === 'ADMIN') {
    return targetRole === 'MANAGER' || targetRole === 'STAFF';
  }

  return false;
}

function getDatabaseErrorCode(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null) {
    return undefined;
  }

  const record = error as {
    code?: unknown;
    cause?: unknown;
  };

  if (typeof record.code === 'string') {
    return record.code;
  }

  if (
    typeof record.cause === 'object' &&
    record.cause !== null &&
    'code' in record.cause
  ) {
    const cause = record.cause as {
      code?: unknown;
    };

    if (typeof cause.code === 'string') {
      return cause.code;
    }
  }

  return undefined;
}

@Injectable()
export class UsersService {
  async findByOrganizationAndEmail(
    organizationCode: string,
    email: string,
  ): Promise<User | undefined> {
    const normalizedOrganizationCode = organizationCode.trim().toUpperCase();

    const normalizedEmail = email.trim().toLowerCase();

    const [user] = await db
      .select({
        id: users.id,
        organizationId: users.organizationId,
        email: users.email,
        passwordHash: users.passwordHash,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        isActive: users.isActive,
        tokenVersion: users.tokenVersion,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .innerJoin(organizations, eq(users.organizationId, organizations.id))
      .where(
        and(
          eq(organizations.code, normalizedOrganizationCode),
          eq(users.email, normalizedEmail),
        ),
      )
      .limit(1);

    return user;
  }

  async findByIdAndOrganization(
    userId: string,
    organizationId: string,
  ): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(
        and(eq(users.id, userId), eq(users.organizationId, organizationId)),
      )
      .limit(1);

    return user;
  }

  async listUsers(organizationId: string): Promise<PublicUser[]> {
    return db
      .select({
        id: users.id,
        organizationId: users.organizationId,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.organizationId, organizationId))
      .orderBy(asc(users.createdAt));
  }

  async createUser(
    organizationId: string,
    actorRole: User['role'],
    createUserDto: CreateUserDto,
  ): Promise<PublicUser> {
    if (!canAssignRole(actorRole, createUserDto.role)) {
      throw new ForbiddenException(
        `Role ${actorRole} cannot create a ${createUserDto.role} user`,
      );
    }

    const normalizedEmail = createUserDto.email.trim().toLowerCase();

    const [existingUser] = await db
      .select({
        id: users.id,
      })
      .from(users)
      .where(
        and(
          eq(users.organizationId, organizationId),
          eq(users.email, normalizedEmail),
        ),
      )
      .limit(1);

    if (existingUser) {
      throw new ConflictException(
        'A user with this email already exists in the organization',
      );
    }

    const passwordHash = await hash(createUserDto.password, 12);

    try {
      const [createdUser] = await db
        .insert(users)
        .values({
          organizationId,
          email: normalizedEmail,
          passwordHash,
          firstName: createUserDto.firstName.trim(),
          lastName: createUserDto.lastName.trim(),
          role: createUserDto.role,
          isActive: true,
        })
        .returning({
          id: users.id,
          organizationId: users.organizationId,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          role: users.role,
          isActive: users.isActive,
          createdAt: users.createdAt,
        });

      if (!createdUser) {
        throw new Error('Database did not return the created user');
      }

      return createdUser;
    } catch (error: unknown) {
      if (getDatabaseErrorCode(error) === '23505') {
        throw new ConflictException(
          'A user with this email already exists in the organization',
        );
      }

      throw error;
    }
  }

  async updateUserStatus(
    organizationId: string,
    actorUserId: string,
    actorRole: User['role'],
    targetUserId: string,
    isActive: boolean,
  ): Promise<PublicUser> {
    if (actorUserId === targetUserId && !isActive) {
      throw new ForbiddenException('You cannot deactivate your own account');
    }

    const [targetUser] = await db
      .select({
        id: users.id,
        organizationId: users.organizationId,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(
        and(
          eq(users.id, targetUserId),
          eq(users.organizationId, organizationId),
        ),
      )
      .limit(1);

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    if (!canManageUser(actorRole, targetUser.role)) {
      throw new ForbiddenException(
        `Role ${actorRole} cannot modify a ${targetUser.role} user`,
      );
    }

    if (targetUser.isActive === isActive) {
      return targetUser;
    }

    const [updatedUser] = await db
      .update(users)
      .set({
        isActive,
        tokenVersion: sql`${users.tokenVersion} + 1`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(users.id, targetUserId),
          eq(users.organizationId, organizationId),
        ),
      )
      .returning({
        id: users.id,
        organizationId: users.organizationId,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
      });

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    return updatedUser;
  }

  async updatePassword(
    userId: string,
    organizationId: string,
    passwordHash: string,
  ): Promise<boolean> {
    const [updatedUser] = await db
      .update(users)
      .set({
        passwordHash,
        tokenVersion: sql`${users.tokenVersion} + 1`,
        updatedAt: new Date(),
      })
      .where(
        and(eq(users.id, userId), eq(users.organizationId, organizationId)),
      )
      .returning({
        id: users.id,
      });

    return Boolean(updatedUser);
  }

  async incrementTokenVersion(
    userId: string,
    organizationId: string,
  ): Promise<boolean> {
    const [updatedUser] = await db
      .update(users)
      .set({
        tokenVersion: sql`${users.tokenVersion} + 1`,
        updatedAt: new Date(),
      })
      .where(
        and(eq(users.id, userId), eq(users.organizationId, organizationId)),
      )
      .returning({
        id: users.id,
      });

    return Boolean(updatedUser);
  }

  async updateLastLogin(userId: string): Promise<void> {
    await db
      .update(users)
      .set({
        lastLoginAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }
}
