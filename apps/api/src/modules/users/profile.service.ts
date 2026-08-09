import { Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';

import { db, users } from '@erp/db';

import type { UpdateProfileDto } from './dto/update-profile.dto';
import type { PublicUser } from './users.service';

const profileSelection = {
  id: users.id,
  organizationId: users.organizationId,
  email: users.email,
  firstName: users.firstName,
  lastName: users.lastName,
  role: users.role,
  isActive: users.isActive,
  lastLoginAt: users.lastLoginAt,
  avatarUrl: users.avatarUrl,
  avatarFileName: users.avatarFileName,
  avatarMimeType: users.avatarMimeType,
  avatarSize: users.avatarSize,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
  deletedAt: users.deletedAt,
};

@Injectable()
export class ProfileService {
  async getProfile(
    userId: string,
    organizationId: string,
  ): Promise<PublicUser> {
    const [user] = await db
      .select(profileSelection)
      .from(users)
      .where(
        and(
          eq(users.id, userId),
          eq(users.organizationId, organizationId),
          isNull(users.deletedAt),
        ),
      )
      .limit(1);

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    return user;
  }

  async updateProfile(
    userId: string,
    organizationId: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<PublicUser> {
    const currentUser = await this.getProfile(userId, organizationId);

    const [updatedUser] = await db
      .update(users)
      .set({
        firstName: updateProfileDto.firstName ?? currentUser.firstName,

        lastName: updateProfileDto.lastName ?? currentUser.lastName,

        updatedAt: new Date(),
      })
      .where(
        and(
          eq(users.id, userId),
          eq(users.organizationId, organizationId),
          isNull(users.deletedAt),
        ),
      )
      .returning(profileSelection);

    if (!updatedUser) {
      throw new NotFoundException('User profile not found');
    }

    return updatedUser;
  }
}
