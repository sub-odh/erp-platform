import { Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { db, organizations, type Organization } from '@erp/db';

import { MediaService } from '../media/media.service';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompanyService {
  constructor(private readonly mediaService: MediaService) {}

  async findCurrent(organizationId: string): Promise<Organization> {
    const [organization] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, organizationId))
      .limit(1);

    if (!organization) {
      throw new NotFoundException('Company not found');
    }

    return organization;
  }

  async updateCurrent(
    organizationId: string,
    updateCompanyDto: UpdateCompanyDto,
  ): Promise<Organization> {
    const [updatedOrganization] = await db
      .update(organizations)
      .set({
        ...updateCompanyDto,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, organizationId))
      .returning();

    if (!updatedOrganization) {
      throw new NotFoundException('Company not found');
    }

    return updatedOrganization;
  }

  async uploadLogo(
    organizationId: string,
    file: Express.Multer.File | undefined,
  ): Promise<Organization> {
    const currentCompany = await this.findCurrent(organizationId);

    const uploaded = await this.mediaService.uploadImage(file, 'company');

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
        throw new NotFoundException('Company not found');
      }

      await this.mediaService.deleteImage(currentCompany.logoUrl);

      return updatedOrganization;
    } catch (error: unknown) {
      await this.mediaService.deleteImage(uploaded.url);

      throw error;
    }
  }

  async removeLogo(organizationId: string): Promise<Organization> {
    const currentCompany = await this.findCurrent(organizationId);

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
      throw new NotFoundException('Company not found');
    }

    await this.mediaService.deleteImage(currentCompany.logoUrl);

    return updatedOrganization;
  }

  async uploadInvoiceLogo(
    organizationId: string,
    file: Express.Multer.File | undefined,
  ): Promise<Organization> {
    const current = await this.findCurrent(organizationId);
    const uploaded = await this.mediaService.uploadImage(file, 'company');
    try {
      const [updated] = await db
        .update(organizations)
        .set({
          invoiceLogoUrl: uploaded.url,
          invoiceLogoFileName: uploaded.fileName,
          invoiceLogoMimeType: uploaded.mimeType,
          invoiceLogoSize: uploaded.size,
          updatedAt: new Date(),
        })
        .where(eq(organizations.id, organizationId))
        .returning();
      if (!updated) throw new NotFoundException('Company not found');
      await this.mediaService.deleteImage(current.invoiceLogoUrl);
      return updated;
    } catch (error: unknown) {
      await this.mediaService.deleteImage(uploaded.url);
      throw error;
    }
  }

  async removeInvoiceLogo(organizationId: string): Promise<Organization> {
    const current = await this.findCurrent(organizationId);
    const [updated] = await db
      .update(organizations)
      .set({
        invoiceLogoUrl: null,
        invoiceLogoFileName: null,
        invoiceLogoMimeType: null,
        invoiceLogoSize: null,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, organizationId))
      .returning();
    if (!updated) throw new NotFoundException('Company not found');
    await this.mediaService.deleteImage(current.invoiceLogoUrl);
    return updated;
  }

  async uploadFavicon(
    organizationId: string,
    file: Express.Multer.File | undefined,
  ): Promise<Organization> {
    const current = await this.findCurrent(organizationId);
    const uploaded = await this.mediaService.uploadImage(file, 'company');
    try {
      const [updated] = await db
        .update(organizations)
        .set({
          faviconUrl: uploaded.url,
          faviconFileName: uploaded.fileName,
          faviconMimeType: uploaded.mimeType,
          faviconSize: uploaded.size,
          updatedAt: new Date(),
        })
        .where(eq(organizations.id, organizationId))
        .returning();
      if (!updated) throw new NotFoundException('Company not found');
      await this.mediaService.deleteImage(current.faviconUrl);
      return updated;
    } catch (error: unknown) {
      await this.mediaService.deleteImage(uploaded.url);
      throw error;
    }
  }

  async removeFavicon(organizationId: string): Promise<Organization> {
    const current = await this.findCurrent(organizationId);
    const [updated] = await db
      .update(organizations)
      .set({
        faviconUrl: null,
        faviconFileName: null,
        faviconMimeType: null,
        faviconSize: null,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, organizationId))
      .returning();
    if (!updated) throw new NotFoundException('Company not found');
    await this.mediaService.deleteImage(current.faviconUrl);
    return updated;
  }
}
