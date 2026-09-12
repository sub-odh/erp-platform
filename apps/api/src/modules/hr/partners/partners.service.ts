import { Injectable, NotFoundException } from '@nestjs/common';

import type { HrPartner } from '@erp/db';

import { MediaService } from '../../media/media.service';
import { EmployeesService } from '../employees/employees.service';
import { CreatePartnerDto, UpdatePartnerDto } from './dto/partner.dto';
import {
  PartnersRepository,
  type PartnerAssignmentRow,
} from './partners.repository';

export interface PartnerAssigneeView {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
}

export interface PartnerView {
  id: string;
  name: string;
  portalUrl: string | null;
  websiteUrl: string | null;
  logoUrl: string | null;
  logoFileName: string | null;
  assignedEmployees: PartnerAssigneeView[];
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class PartnersService {
  constructor(
    private readonly repository: PartnersRepository,
    private readonly employeesService: EmployeesService,
    private readonly mediaService: MediaService,
  ) {}

  async list(tenantId: string): Promise<PartnerView[]> {
    const partners = await this.repository.list(tenantId);
    const assignments = await this.repository.listAssignments(
      tenantId,
      partners.map((partner) => partner.id),
    );

    return partners.map((partner) =>
      this.toView(
        partner,
        assignments.filter((row) => row.partnerId === partner.id),
      ),
    );
  }

  async findById(tenantId: string, partnerId: string): Promise<PartnerView> {
    return this.requirePartnerView(tenantId, partnerId);
  }

  async create(
    tenantId: string,
    actorUserId: string,
    dto: CreatePartnerDto,
  ): Promise<PartnerView> {
    const employeeIds = await this.assertEmployees(tenantId, dto.employeeIds);
    const created = await this.repository.create({
      tenantId,
      name: dto.name,
      portalUrl: dto.portalUrl ?? null,
      websiteUrl: dto.websiteUrl ?? null,
      createdBy: actorUserId,
    });

    await this.repository.replaceAssignments(tenantId, created.id, employeeIds);
    return this.requirePartnerView(tenantId, created.id);
  }

  async update(
    tenantId: string,
    partnerId: string,
    dto: UpdatePartnerDto,
  ): Promise<PartnerView> {
    await this.requirePartner(tenantId, partnerId);

    const updated = await this.repository.update(tenantId, partnerId, {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.portalUrl !== undefined ? { portalUrl: dto.portalUrl } : {}),
      ...(dto.websiteUrl !== undefined ? { websiteUrl: dto.websiteUrl } : {}),
    });

    if (!updated) {
      throw new NotFoundException('Partner was not found');
    }

    if (dto.employeeIds !== undefined) {
      const employeeIds = await this.assertEmployees(tenantId, dto.employeeIds);
      await this.repository.replaceAssignments(tenantId, partnerId, employeeIds);
    }

    return this.requirePartnerView(tenantId, partnerId);
  }

  async remove(tenantId: string, partnerId: string) {
    const current = await this.requirePartner(tenantId, partnerId);
    await this.repository.delete(tenantId, partnerId);
    await this.mediaService.deleteImage(current.logoUrl);
    return { success: true };
  }

  async uploadLogo(
    tenantId: string,
    partnerId: string,
    file: Express.Multer.File | undefined,
  ): Promise<PartnerView> {
    const current = await this.requirePartner(tenantId, partnerId);
    const uploaded = await this.mediaService.uploadImage(file, 'hr');

    try {
      const updated = await this.repository.update(tenantId, partnerId, {
        logoUrl: uploaded.url,
        logoFileName: uploaded.fileName,
        logoMimeType: uploaded.mimeType,
        logoSize: uploaded.size,
      });

      if (!updated) {
        throw new NotFoundException('Partner was not found');
      }

      await this.mediaService.deleteImage(current.logoUrl);
    } catch (error: unknown) {
      await this.mediaService.deleteImage(uploaded.url);
      throw error;
    }

    return this.requirePartnerView(tenantId, partnerId);
  }

  private async requirePartnerView(tenantId: string, partnerId: string) {
    const partner = await this.requirePartner(tenantId, partnerId);
    const assignments = await this.repository.listAssignments(tenantId, [
      partnerId,
    ]);
    return this.toView(partner, assignments);
  }

  private async requirePartner(tenantId: string, partnerId: string) {
    const partner = await this.repository.findById(tenantId, partnerId);

    if (!partner) {
      throw new NotFoundException('Partner was not found');
    }

    return partner;
  }

  private async assertEmployees(tenantId: string, employeeIds?: string[]) {
    const uniqueIds = [...new Set(employeeIds ?? [])];

    await Promise.all(
      uniqueIds.map((employeeId) =>
        this.employeesService.findById(tenantId, employeeId),
      ),
    );

    return uniqueIds;
  }

  private toView(
    partner: HrPartner,
    assignments: PartnerAssignmentRow[],
  ): PartnerView {
    return {
      id: partner.id,
      name: partner.name,
      portalUrl: partner.portalUrl,
      websiteUrl: partner.websiteUrl,
      logoUrl: partner.logoUrl,
      logoFileName: partner.logoFileName,
      assignedEmployees: assignments.map((row) => ({
        id: row.employeeId,
        employeeCode: row.employeeCode,
        firstName: row.firstName,
        lastName: row.lastName,
      })),
      createdAt: partner.createdAt,
      updatedAt: partner.updatedAt,
    };
  }
}
