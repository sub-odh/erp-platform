import { Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';

import { db, users } from '@erp/db';

import type { UpdateProfileDto } from './dto/update-profile.dto';
import type { PublicUser } from './users.service';

const profileSelection = {
  id: users.id,
  organizationId: users.organizationId,
  employeeId: users.employeeId,
  email: users.email,
  firstName: users.firstName,
  lastName: users.lastName,
  phone: users.phone,
  dateOfBirth: users.dateOfBirth,
  fatherName: users.fatherName,
  motherName: users.motherName,
  citizenshipNumber: users.citizenshipNumber,
  panNumber: users.panNumber,
  permanentAddress: users.permanentAddress,
  role: users.role,
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

        phone:
          updateProfileDto.phone !== undefined
            ? updateProfileDto.phone
            : currentUser.phone,

        dateOfBirth:
          updateProfileDto.dateOfBirth !== undefined
            ? updateProfileDto.dateOfBirth
            : currentUser.dateOfBirth,

        fatherName:
          updateProfileDto.fatherName !== undefined
            ? updateProfileDto.fatherName
            : currentUser.fatherName,

        motherName:
          updateProfileDto.motherName !== undefined
            ? updateProfileDto.motherName
            : currentUser.motherName,

        citizenshipNumber:
          updateProfileDto.citizenshipNumber !== undefined
            ? updateProfileDto.citizenshipNumber
            : currentUser.citizenshipNumber,

        panNumber:
          updateProfileDto.panNumber !== undefined
            ? updateProfileDto.panNumber
            : currentUser.panNumber,

        permanentAddress:
          updateProfileDto.permanentAddress !== undefined
            ? updateProfileDto.permanentAddress
            : currentUser.permanentAddress,

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
