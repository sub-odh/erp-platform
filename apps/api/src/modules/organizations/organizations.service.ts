import { Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { db, organizations, type Organization } from '@erp/db';

import { MediaService } from '../media/media.service';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(private readonly mediaService: MediaService) {}

  async findCurrent(organizationId: string): Promise<Organization> {
    const [organization] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, organizationId))
      .limit(1);

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return organization;
  }

  async updateCurrent(
    organizationId: string,
    updateOrganizationDto: UpdateOrganizationDto,
  ): Promise<Organization> {
    const [updatedOrganization] = await db
      .update(organizations)
      .set({
        ...updateOrganizationDto,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, organizationId))
      .returning();

    if (!updatedOrganization) {
      throw new NotFoundException('Organization not found');
    }

    return updatedOrganization;
  }

  async uploadLogo(
    organizationId: string,
    file: Express.Multer.File | undefined,
  ): Promise<Organization> {
    const currentOrganization = await this.findCurrent(organizationId);

    const uploaded = await this.mediaService.uploadImage(file, 'organizations');

    try {
      const [updatedOrganization] = await db
        .update(organizations)
        .set({
          logoUrl: uploaded.url,
          logoFileName: uploaded.fileName,
          logoMimeType: uploaded.mimeType,
          logoSize: uploaded.size,
          updatedAt: new Date(),
        })
        .where(eq(organizations.id, organizationId))
        .returning();

      if (!updatedOrganization) {
        throw new NotFoundException('Organization not found');
      }

      await this.mediaService.deleteImage(currentOrganization.logoUrl);

      return updatedOrganization;
    } catch (error: unknown) {
      await this.mediaService.deleteImage(uploaded.url);

      throw error;
    }
  }

  async removeLogo(organizationId: string): Promise<Organization> {
    const currentOrganization = await this.findCurrent(organizationId);

    const [updatedOrganization] = await db
      .update(organizations)
      .set({
        logoUrl: null,
        logoFileName: null,
        logoMimeType: null,
        logoSize: null,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, organizationId))
      .returning();

    if (!updatedOrganization) {
      throw new NotFoundException('Organization not found');
    }

    await this.mediaService.deleteImage(currentOrganization.logoUrl);

    return updatedOrganization;
  }
}
