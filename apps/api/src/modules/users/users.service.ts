import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { hash } from 'bcrypt';
import {
  and,
  asc,
  desc,
  eq,
  ilike,
  isNotNull,
  isNull,
  or,
  sql,
  type SQL,
} from 'drizzle-orm';

import { authSessions, db, organizations, users, type User } from '@erp/db';

import {
  createPaginatedResult,
  type PaginatedResult,
} from '../../common/pagination';
import type { AssignableUserRole, CreateUserDto } from './dto/create-user.dto';
import type {
  ListUsersQueryDto,
  UserSortDirection,
  UserSortField,
} from './dto/list-users-query.dto';
import type { UpdateUserDto } from './dto/update-user.dto';

export type PublicUser = Pick<
  User,
  | 'id'
  | 'organizationId'
  | 'email'
  | 'firstName'
  | 'lastName'
  | 'role'
  | 'isActive'
  | 'lastLoginAt'
  | 'createdAt'
  | 'updatedAt'
  | 'deletedAt'
>;

export interface UserListCounts {
  active: number;
  inactive: number;
  archived: number;
  total: number;
}

export interface PaginatedUsersResult extends PaginatedResult<PublicUser> {
  counts: UserListCounts;
}

const publicUserSelection = {
  id: users.id,
  organizationId: users.organizationId,
  email: users.email,
  firstName: users.firstName,
  lastName: users.lastName,
  role: users.role,
  isActive: users.isActive,
  lastLoginAt: users.lastLoginAt,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
  deletedAt: users.deletedAt,
};

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

    const [result] = await db
      .select({
        user: users,
      })
      .from(users)
      .innerJoin(organizations, eq(users.organizationId, organizations.id))
      .where(
        and(
          eq(organizations.code, normalizedOrganizationCode),
          eq(users.email, normalizedEmail),
          isNull(users.deletedAt),
        ),
      )
      .limit(1);

    return result?.user;
  }

  async findByIdAndOrganization(
    userId: string,
    organizationId: string,
  ): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.id, userId),
          eq(users.organizationId, organizationId),
          isNull(users.deletedAt),
        ),
      )
      .limit(1);

    return user;
  }

  async listUsers(
    organizationId: string,
    query: ListUsersQueryDto,
  ): Promise<PaginatedUsersResult> {
    const conditions = this.createListConditions(organizationId, query);

    const offset = (query.page - 1) * query.limit;

    const orderColumn = this.getSortColumn(query.sortBy);

    const orderExpression =
      query.sortDirection === 'asc' ? asc(orderColumn) : desc(orderColumn);

    const [data, totalResult, countsResult] = await Promise.all([
      db
        .select(publicUserSelection)
        .from(users)
        .where(and(...conditions))
        .orderBy(orderExpression)
        .limit(query.limit)
        .offset(offset),

      db
        .select({
          total: sql<number>`count(*)::int`,
        })
        .from(users)
        .where(and(...conditions)),

      db
        .select({
          active: sql<number>`
            count(*) filter (
              where ${users.deletedAt} is null
              and ${users.isActive} = true
            )::int
          `,
          inactive: sql<number>`
            count(*) filter (
              where ${users.deletedAt} is null
              and ${users.isActive} = false
            )::int
          `,
          archived: sql<number>`
            count(*) filter (
              where ${users.deletedAt} is not null
            )::int
          `,
          total: sql<number>`count(*)::int`,
        })
        .from(users)
        .where(eq(users.organizationId, organizationId)),
    ]);

    const paginated = createPaginatedResult(
      data,
      query.page,
      query.limit,
      totalResult[0]?.total ?? 0,
    );

    return {
      ...paginated,
      counts: {
        active: countsResult[0]?.active ?? 0,
        inactive: countsResult[0]?.inactive ?? 0,
        archived: countsResult[0]?.archived ?? 0,
        total: countsResult[0]?.total ?? 0,
      },
    };
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
          mustChangePassword: false,
        })
        .returning(publicUserSelection);

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

  async updateUser(
    organizationId: string,
    actorUserId: string,
    actorRole: User['role'],
    targetUserId: string,
    updateUserDto: UpdateUserDto,
  ): Promise<PublicUser> {
    void actorUserId;

    const [targetUser] = await db
      .select(publicUserSelection)
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

    if (targetUser.role === 'OWNER') {
      throw new ForbiddenException('The owner account cannot be edited');
    }

    if (!canManageUser(actorRole, targetUser.role)) {
      throw new ForbiddenException(
        `Role ${actorRole} cannot modify a ${targetUser.role} user`,
      );
    }

    if (
      updateUserDto.role !== undefined &&
      !canAssignRole(actorRole, updateUserDto.role)
    ) {
      throw new ForbiddenException(
        `Role ${actorRole} cannot assign the ${updateUserDto.role} role`,
      );
    }

    const roleChanged =
      updateUserDto.role !== undefined &&
      updateUserDto.role !== targetUser.role;

    const [updatedUser] = await db
      .update(users)
      .set({
        firstName:
          updateUserDto.firstName !== undefined
            ? updateUserDto.firstName.trim()
            : targetUser.firstName,
        lastName:
          updateUserDto.lastName !== undefined
            ? updateUserDto.lastName.trim()
            : targetUser.lastName,
        role: updateUserDto.role ?? targetUser.role,
        tokenVersion: roleChanged
          ? sql`${users.tokenVersion} + 1`
          : users.tokenVersion,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(users.id, targetUserId),
          eq(users.organizationId, organizationId),
          isNull(users.deletedAt),
        ),
      )
      .returning(publicUserSelection);

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    return updatedUser;
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
      .select(publicUserSelection)
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

    if (targetUser.role === 'OWNER') {
      throw new ForbiddenException(
        'The owner account status cannot be changed',
      );
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
          isNull(users.deletedAt),
        ),
      )
      .returning(publicUserSelection);

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    if (!isActive) {
      await this.revokeAllUserSessions(targetUserId);
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
        mustChangePassword: false,
        passwordChangedAt: new Date(),
        tokenVersion: sql`${users.tokenVersion} + 1`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(users.id, userId),
          eq(users.organizationId, organizationId),
          isNull(users.deletedAt),
        ),
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
        and(
          eq(users.id, userId),
          eq(users.organizationId, organizationId),
          isNull(users.deletedAt),
        ),
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
      .where(and(eq(users.id, userId), isNull(users.deletedAt)));
  }

  async archiveUser(
    organizationId: string,
    actorUserId: string,
    actorRole: User['role'],
    targetUserId: string,
  ): Promise<void> {
    if (actorUserId === targetUserId) {
      throw new ForbiddenException('You cannot archive your own account');
    }

    const [targetUser] = await db
      .select({
        id: users.id,
        role: users.role,
        deletedAt: users.deletedAt,
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

    if (targetUser.role === 'OWNER') {
      throw new ForbiddenException('The owner account cannot be archived');
    }

    if (!canManageUser(actorRole, targetUser.role)) {
      throw new ForbiddenException(
        `Role ${actorRole} cannot archive a ${targetUser.role} user`,
      );
    }

    if (targetUser.deletedAt) {
      return;
    }

    const [archivedUser] = await db
      .update(users)
      .set({
        isActive: false,
        deletedAt: new Date(),
        deletedBy: actorUserId,
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

    if (!archivedUser) {
      throw new NotFoundException('User not found');
    }

    await this.revokeAllUserSessions(targetUserId);
  }

  async restoreUser(
    organizationId: string,
    actorRole: User['role'],
    targetUserId: string,
  ): Promise<PublicUser> {
    const [targetUser] = await db
      .select({
        id: users.id,
        role: users.role,
        deletedAt: users.deletedAt,
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

    if (!targetUser.deletedAt) {
      throw new ConflictException('User is not archived');
    }

    if (targetUser.role === 'OWNER') {
      throw new ForbiddenException('The owner account cannot be restored here');
    }

    if (!canManageUser(actorRole, targetUser.role)) {
      throw new ForbiddenException(
        `Role ${actorRole} cannot restore a ${targetUser.role} user`,
      );
    }

    const [restoredUser] = await db
      .update(users)
      .set({
        isActive: false,
        deletedAt: null,
        deletedBy: null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(users.id, targetUserId),
          eq(users.organizationId, organizationId),
        ),
      )
      .returning(publicUserSelection);

    if (!restoredUser) {
      throw new NotFoundException('User not found');
    }

    return restoredUser;
  }

  private createListConditions(
    organizationId: string,
    query: ListUsersQueryDto,
  ): SQL[] {
    const conditions: SQL[] = [eq(users.organizationId, organizationId)];

    switch (query.status) {
      case 'active':
        conditions.push(isNull(users.deletedAt), eq(users.isActive, true));
        break;

      case 'inactive':
        conditions.push(isNull(users.deletedAt), eq(users.isActive, false));
        break;

      case 'archived':
        conditions.push(isNotNull(users.deletedAt));
        break;

      case 'all':
        break;
    }

    if (query.role) {
      conditions.push(eq(users.role, query.role));
    }

    const search = query.search?.trim();

    if (search) {
      const pattern = `%${search}%`;

      const searchCondition = or(
        ilike(users.firstName, pattern),
        ilike(users.lastName, pattern),
        ilike(users.email, pattern),
        ilike(users.role, pattern),
      );

      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }

    return conditions;
  }

  private getSortColumn(sortBy: UserSortField) {
    switch (sortBy) {
      case 'firstName':
        return users.firstName;

      case 'email':
        return users.email;

      case 'role':
        return users.role;

      case 'lastLoginAt':
        return users.lastLoginAt;

      case 'createdAt':
      default:
        return users.createdAt;
    }
  }

  private async revokeAllUserSessions(userId: string): Promise<void> {
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
