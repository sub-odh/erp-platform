import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';

import { db, users } from '@erp/db';

import { MediaService } from '../media/media.service';
import type { PublicUser } from './users.service';

const signatureUserSelection = {
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
export class UserSignatureService {
  constructor(private readonly mediaService: MediaService) {}

  async uploadSignature(
    organizationId: string,
    userId: string,
    file: Express.Multer.File | undefined,
  ): Promise<PublicUser> {
    if (!file) {
      throw new BadRequestException('Signature file is required');
    }

    if (file.mimetype !== 'image/png') {
      throw new BadRequestException('Signature must be a PNG image');
    }

    const currentUser = await this.findUser(organizationId, userId);
    const uploaded = await this.mediaService.uploadImage(file, 'users');

    try {
      const [updatedUser] = await db
        .update(users)
        .set({
          signatureUrl: uploaded.url,
          signatureFileName: uploaded.fileName,
          signatureMimeType: uploaded.mimeType,
          signatureSize: uploaded.size,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(users.id, userId),
            eq(users.organizationId, organizationId),
            isNull(users.deletedAt),
          ),
        )
        .returning(signatureUserSelection);

      if (!updatedUser) {
        throw new NotFoundException('User profile not found');
      }

      await this.mediaService.deleteImage(currentUser.signatureUrl);

      return updatedUser;
    } catch (error: unknown) {
      await this.mediaService.deleteImage(uploaded.url);

      throw error;
    }
  }

  async removeSignature(
    organizationId: string,
    userId: string,
  ): Promise<PublicUser> {
    const currentUser = await this.findUser(organizationId, userId);

    const [updatedUser] = await db
      .update(users)
      .set({
        signatureUrl: null,
        signatureFileName: null,
        signatureMimeType: null,
        signatureSize: null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(users.id, userId),
          eq(users.organizationId, organizationId),
          isNull(users.deletedAt),
        ),
      )
      .returning(signatureUserSelection);

    if (!updatedUser) {
      throw new NotFoundException('User profile not found');
    }

    await this.mediaService.deleteImage(currentUser.signatureUrl);

    return updatedUser;
  }

  private async findUser(organizationId: string, userId: string) {
    const [user] = await db
      .select({ signatureUrl: users.signatureUrl })
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
}
