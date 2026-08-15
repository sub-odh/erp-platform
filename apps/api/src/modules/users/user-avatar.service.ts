import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';

import { db, users, type User } from '@erp/db';

import { MediaService } from '../media/media.service';
import type { PublicUser } from './users.service';

const avatarUserSelection = {
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

function canManageAvatar(
  actorUserId: string,
  actorRole: User['role'],
  targetUser: Pick<User, 'id' | 'role'>,
): boolean {
  if (actorUserId === targetUser.id) {
    return true;
  }

  if (actorRole === 'OWNER') {
    return true;
  }

  if (actorRole === 'ADMIN') {
    return targetUser.role === 'MANAGER' || targetUser.role === 'STAFF';
  }

  return false;
}

@Injectable()
export class UserAvatarService {
  constructor(private readonly mediaService: MediaService) {}

  async uploadAvatar(
    organizationId: string,
    actorUserId: string,
    actorRole: User['role'],
    targetUserId: string,
    file: Express.Multer.File | undefined,
  ): Promise<PublicUser> {
    const targetUser = await this.findTargetUser(organizationId, targetUserId);

    this.assertCanManageAvatar(actorUserId, actorRole, targetUser);

    const uploaded = await this.mediaService.uploadImage(file, 'users');

    try {
      const [updatedUser] = await db
        .update(users)
        .set({
          avatarUrl: uploaded.url,
          avatarFileName: uploaded.fileName,
          avatarMimeType: uploaded.mimeType,
          avatarSize: uploaded.size,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(users.id, targetUserId),
            eq(users.organizationId, organizationId),
            isNull(users.deletedAt),
          ),
        )
        .returning(avatarUserSelection);

      if (!updatedUser) {
        throw new NotFoundException('User not found');
      }

      await this.mediaService.deleteImage(targetUser.avatarUrl);

      return updatedUser;
    } catch (error: unknown) {
      await this.mediaService.deleteImage(uploaded.url);

      throw error;
    }
  }

  async removeAvatar(
    organizationId: string,
    actorUserId: string,
    actorRole: User['role'],
    targetUserId: string,
  ): Promise<PublicUser> {
    const targetUser = await this.findTargetUser(organizationId, targetUserId);

    this.assertCanManageAvatar(actorUserId, actorRole, targetUser);

    const [updatedUser] = await db
      .update(users)
      .set({
        avatarUrl: null,
        avatarFileName: null,
        avatarMimeType: null,
        avatarSize: null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(users.id, targetUserId),
          eq(users.organizationId, organizationId),
          isNull(users.deletedAt),
        ),
      )
      .returning(avatarUserSelection);

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    await this.mediaService.deleteImage(targetUser.avatarUrl);

    return updatedUser;
  }

  private async findTargetUser(
    organizationId: string,
    targetUserId: string,
  ): Promise<User> {
    const [targetUser] = await db
      .select()
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

    return targetUser;
  }

  private assertCanManageAvatar(
    actorUserId: string,
    actorRole: User['role'],
    targetUser: Pick<User, 'id' | 'role'>,
  ): void {
    if (!canManageAvatar(actorUserId, actorRole, targetUser)) {
      throw new ForbiddenException('You cannot modify this user avatar');
    }
  }
}
