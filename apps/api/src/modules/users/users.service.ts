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

import {
  authSessions,
  companyEmployeeRoles,
  db,
  organizations,
  users,
  withTenantContext,
  type User,
} from '@erp/db';

import {
  createPaginatedResult,
  type PaginatedResult,
} from '../../common/pagination';
import type { AssignableUserRole, CreateUserDto } from './dto/create-user.dto';
import type {
  ListUsersQueryDto,
  UserSortField,
} from './dto/list-users-query.dto';
import type { UpdateUserDto } from './dto/update-user.dto';
import { LicensingService } from '../../common/licensing/licensing.service';
import { NotificationsService } from '../notifications/notifications.service';
import { MediaService } from '../media/media.service';

export type PublicUser = Pick<
  User,
  | 'id'
  | 'organizationId'
  | 'employeeId'
  | 'email'
  | 'firstName'
  | 'lastName'
  | 'phone'
  | 'dateOfBirth'
  | 'joinedDate'
  | 'fatherName'
  | 'motherName'
  | 'citizenshipNumber'
  | 'panNumber'
  | 'permanentAddress'
  | 'role'
  | 'employeeRole'
  | 'isActive'
  | 'lastLoginAt'
  | 'avatarUrl'
  | 'avatarFileName'
  | 'avatarMimeType'
  | 'avatarSize'
  | 'signatureUrl'
  | 'signatureFileName'
  | 'signatureMimeType'
  | 'signatureSize'
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
  employeeId: users.employeeId,
  email: users.email,
  firstName: users.firstName,
  lastName: users.lastName,
  phone: users.phone,
  dateOfBirth: users.dateOfBirth,
  joinedDate: users.joinedDate,
  fatherName: users.fatherName,
  motherName: users.motherName,
  citizenshipNumber: users.citizenshipNumber,
  panNumber: users.panNumber,
  permanentAddress: users.permanentAddress,
  role: users.role,
  employeeRole: users.employeeRole,
  isActive: users.isActive,
  lastLoginAt: users.lastLoginAt,
  avatarUrl: users.avatarUrl,
  avatarFileName: users.avatarFileName,
  avatarMimeType: users.avatarMimeType,
  avatarSize: users.avatarSize,
  signatureUrl: users.signatureUrl,
  signatureFileName: users.signatureFileName,
  signatureMimeType: users.signatureMimeType,
  signatureSize: users.signatureSize,
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

  if (actorRole === 'SUPER_ADMIN') {
    return targetRole !== 'SUPER_ADMIN';
  }

  if (actorRole === 'ADMIN') {
    return targetRole !== 'SUPER_ADMIN' && targetRole !== 'ADMIN';
  }

  if (actorRole === 'HR') {
    return targetRole === 'EMPLOYEE';
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

  if (actorRole === 'SUPER_ADMIN') {
    return targetRole !== 'OWNER' && targetRole !== 'SUPER_ADMIN';
  }

  if (actorRole === 'ADMIN') {
    return !['OWNER', 'SUPER_ADMIN', 'ADMIN'].includes(targetRole);
  }

  if (actorRole === 'HR') {
    return targetRole === 'EMPLOYEE';
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
  constructor(
    private readonly licensingService: LicensingService,
    private readonly notifications: NotificationsService,
    private readonly mediaService: MediaService,
  ) {}

  async findByOrganizationAndEmail(
    organizationCode: string,
    email: string,
  ): Promise<User | undefined> {
    const normalizedOrganizationCode = organizationCode.trim().toUpperCase();

    const normalizedEmail = email.trim().toLowerCase();

    const [organization] = await db
      .select({
        id: organizations.id,
      })
      .from(organizations)
      .where(eq(organizations.code, normalizedOrganizationCode))
      .limit(1);

    if (!organization) {
      return undefined;
    }

    return withTenantContext(organization.id, async () => {
      const [user] = await db
        .select({
          user: users,
        })
        .from(users)
        .where(
          and(
            eq(users.organizationId, organization.id),
            eq(users.email, normalizedEmail),
            isNull(users.deletedAt),
          ),
        )
        .limit(1);

      return user?.user;
    });
  }

  async findByIdAndOrganization(
    userId: string,
    organizationId: string,
  ): Promise<User | undefined> {
    return withTenantContext(organizationId, async () => {
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
    });
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
    await this.assertUserCapacity(organizationId);
    if (!canAssignRole(actorRole, createUserDto.role)) {
      throw new ForbiddenException(
        `Role ${actorRole} cannot create a ${createUserDto.role} user`,
      );
    }

    const normalizedEmail = createUserDto.email.trim().toLowerCase();
    const normalizedEmployeeId = createUserDto.employeeId.trim().toUpperCase();
    const employeeRole = createUserDto.employeeRole
      ? await this.requireEmployeeRole(
          organizationId,
          createUserDto.employeeRole,
        )
      : null;

    const [existingUser] = await db
      .select({
        email: users.email,
        employeeId: users.employeeId,
      })
      .from(users)
      .where(
        and(
          eq(users.organizationId, organizationId),
          or(
            eq(users.email, normalizedEmail),
            eq(users.employeeId, normalizedEmployeeId),
          ),
        ),
      )
      .limit(1);

    if (existingUser) {
      throw new ConflictException(
        existingUser.email === normalizedEmail
          ? 'A user with this email already exists in the company'
          : 'A user with this employee ID already exists in the company',
      );
    }

    const passwordHash = await hash(createUserDto.password, 12);

    try {
      const [createdUser] = await db
        .insert(users)
        .values({
          organizationId,
          employeeId: normalizedEmployeeId,
          email: normalizedEmail,
          passwordHash,
          firstName: createUserDto.firstName.trim(),
          lastName: createUserDto.lastName.trim(),
          joinedDate: createUserDto.joinedDate,
          role: createUserDto.role,
          employeeRole,
          isActive: true,
          mustChangePassword: false,
        })
        .returning(publicUserSelection);

      if (!createdUser) {
        throw new Error('Database did not return the created user');
      }

      await this.notifications.notify({
        organizationId,
        recipientUserId: createdUser.id,
        type: 'platform.user.created',
        title: 'Welcome to your ERP workspace',
        message:
          'Your account is ready. Review your profile and assigned role.',
        actionUrl: '/profile',
        entityType: 'platform.user',
        entityId: createdUser.id,
      });

      return createdUser;
    } catch (error: unknown) {
      if (getDatabaseErrorCode(error) === '23505') {
        throw new ConflictException(
          'A user with this email or employee ID already exists in the company',
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

    const employeeRole =
      updateUserDto.employeeRole !== undefined
        ? await this.requireEmployeeRole(
            organizationId,
            updateUserDto.employeeRole,
          )
        : targetUser.employeeRole;

    const employeeId =
      updateUserDto.employeeId !== undefined
        ? updateUserDto.employeeId.trim().toUpperCase()
        : targetUser.employeeId;

    if (employeeId && employeeId !== targetUser.employeeId) {
      const [duplicate] = await db
        .select({ id: users.id })
        .from(users)
        .where(
          and(
            eq(users.organizationId, organizationId),
            eq(users.employeeId, employeeId),
          ),
        )
        .limit(1);
      if (duplicate) {
        throw new ConflictException(
          'A user with this employee ID already exists in the company',
        );
      }
    }

    const [updatedUser] = await db
      .update(users)
      .set({
        employeeId,
        firstName:
          updateUserDto.firstName !== undefined
            ? updateUserDto.firstName.trim()
            : targetUser.firstName,

        lastName:
          updateUserDto.lastName !== undefined
            ? updateUserDto.lastName.trim()
            : targetUser.lastName,

        role: updateUserDto.role ?? targetUser.role,

        employeeRole,

        joinedDate:
          updateUserDto.joinedDate !== undefined
            ? updateUserDto.joinedDate
            : targetUser.joinedDate,

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

    if (isActive) {
      await this.assertUserCapacity(organizationId);
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

  async listEmployeeRoles(organizationId: string) {
    await this.seedEmployeeRoles(organizationId);
    return db
      .select({ id: companyEmployeeRoles.id, name: companyEmployeeRoles.name })
      .from(companyEmployeeRoles)
      .where(eq(companyEmployeeRoles.organizationId, organizationId))
      .orderBy(asc(companyEmployeeRoles.name));
  }

  async createEmployeeRole(organizationId: string, name: string) {
    const normalized = name.trim().replace(/\s+/g, ' ');
    if (normalized.length < 2) {
      throw new ConflictException(
        'Employee role must contain at least 2 characters',
      );
    }
    await this.seedEmployeeRoles(organizationId);
    const existing = await this.findEmployeeRole(organizationId, normalized);
    if (existing)
      throw new ConflictException('This employee role already exists');
    const [created] = await db
      .insert(companyEmployeeRoles)
      .values({ organizationId, name: normalized })
      .returning({
        id: companyEmployeeRoles.id,
        name: companyEmployeeRoles.name,
      });
    if (!created) throw new NotFoundException('Unable to create employee role');
    return created;
  }

  async deleteEmployeeRole(organizationId: string, roleId: string) {
    const [role] = await db
      .select({ id: companyEmployeeRoles.id, name: companyEmployeeRoles.name })
      .from(companyEmployeeRoles)
      .where(
        and(
          eq(companyEmployeeRoles.id, roleId),
          eq(companyEmployeeRoles.organizationId, organizationId),
        ),
      )
      .limit(1);
    if (!role) throw new NotFoundException('Employee role not found');
    const [assigned] = await db
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          eq(users.organizationId, organizationId),
          eq(users.employeeRole, role.name),
          isNull(users.deletedAt),
        ),
      )
      .limit(1);
    if (assigned) {
      throw new ConflictException(
        'Reassign employees before deleting this role',
      );
    }
    await db
      .delete(companyEmployeeRoles)
      .where(eq(companyEmployeeRoles.id, role.id));
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

  async updateLastLogin(userId: string, organizationId: string): Promise<void> {
    await withTenantContext(organizationId, async () => {
      await db
        .update(users)
        .set({
          lastLoginAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(users.id, userId),
            eq(users.organizationId, organizationId),
            isNull(users.deletedAt),
          ),
        );
    });
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

  async permanentlyDeleteUser(
    organizationId: string,
    actorUserId: string,
    actorRole: User['role'],
    targetUserId: string,
  ): Promise<void> {
    if (actorRole !== 'OWNER') {
      throw new ForbiddenException(
        'Only the company owner can permanently delete users',
      );
    }

    if (actorUserId === targetUserId) {
      throw new ForbiddenException('You cannot delete your own account');
    }

    const [targetUser] = await db
      .select({
        id: users.id,
        role: users.role,
        avatarUrl: users.avatarUrl,
        signatureUrl: users.signatureUrl,
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
      throw new ForbiddenException('The owner account cannot be deleted');
    }

    const [deletedUser] = await db
      .delete(users)
      .where(
        and(
          eq(users.id, targetUserId),
          eq(users.organizationId, organizationId),
        ),
      )
      .returning({ id: users.id });

    if (!deletedUser) {
      throw new NotFoundException('User not found');
    }

    await this.mediaService.deleteImage(targetUser.avatarUrl);
    await this.mediaService.deleteImage(targetUser.signatureUrl);
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
        ilike(users.employeeId, pattern),
        ilike(users.role, pattern),
        ilike(users.employeeRole, pattern),
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

  private async seedEmployeeRoles(organizationId: string): Promise<void> {
    const roles = [
      'CEO',
      'COO',
      'CFO',
      'CTO',
      'Director',
      'Department Head',
      'Manager',
      'HR',
      'Finance & Accounts',
      'Operations',
      'Sales',
      'Marketing',
      'IT & Technical',
      'Procurement',
      'Storekeeper',
      'Customer Support',
    ];
    await db
      .insert(companyEmployeeRoles)
      .values(roles.map((name) => ({ organizationId, name })))
      .onConflictDoNothing();
  }

  private async findEmployeeRole(organizationId: string, name: string) {
    const [role] = await db
      .select({ id: companyEmployeeRoles.id, name: companyEmployeeRoles.name })
      .from(companyEmployeeRoles)
      .where(
        and(
          eq(companyEmployeeRoles.organizationId, organizationId),
          sql`lower(${companyEmployeeRoles.name}) = lower(${name})`,
        ),
      )
      .limit(1);
    return role;
  }

  private async requireEmployeeRole(organizationId: string, name: string) {
    await this.seedEmployeeRoles(organizationId);
    const role = await this.findEmployeeRole(organizationId, name.trim());
    if (!role)
      throw new NotFoundException('Employee role not found in this company');
    return role.name;
  }

  private async assertUserCapacity(organizationId: string): Promise<void> {
    const [{ count = 0 } = {}] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(
        and(
          eq(users.organizationId, organizationId),
          eq(users.isActive, true),
          isNull(users.deletedAt),
        ),
      );

    if (count >= this.licensingService.getLicense().maxUsers) {
      throw new ForbiddenException(
        `License user limit of ${this.licensingService.getLicense().maxUsers} has been reached`,
      );
    }
  }
}
