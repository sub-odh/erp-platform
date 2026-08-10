import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  createPaginatedResult,
  type PaginatedResult,
} from '../../../common/pagination';

import { CreateLeadDto } from './dto/create-lead.dto';
import { LeadResponseDto } from './dto/lead-response.dto';
import { ListLeadsQueryDto } from './dto/list-leads-query.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { LeadsRepository } from './leads.repository';

@Injectable()
export class LeadsService {
  constructor(private readonly leadsRepository: LeadsRepository) {}

  async list(
    tenantId: string,
    query: ListLeadsQueryDto,
  ): Promise<PaginatedResult<LeadResponseDto>> {
    const result = await this.leadsRepository.list({
      tenantId,

      search: query.search,

      status: query.status,

      ownerUserId: query.ownerUserId,

      page: query.page,

      limit: query.limit,

      sortBy: query.sortBy,

      sortDirection: query.sortDirection,
    });

    return createPaginatedResult(
      result.data.map((lead) => LeadResponseDto.fromEntity(lead)),
      query.page,
      query.limit,
      result.total,
    );
  }

  async findById(tenantId: string, leadId: string): Promise<LeadResponseDto> {
    const lead = await this.leadsRepository.findById(tenantId, leadId);

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    return LeadResponseDto.fromEntity(lead);
  }

  async create(
    tenantId: string,
    actorUserId: string,
    dto: CreateLeadDto,
  ): Promise<LeadResponseDto> {
    if (dto.ownerUserId) {
      await this.ensureOwnerValid(tenantId, dto.ownerUserId);
    }

    const created = await this.leadsRepository.create({
      tenantId,
      actorUserId,

      firstName: dto.firstName.trim(),

      lastName: dto.lastName.trim(),

      companyName: this.normalizeOptionalText(dto.companyName),

      jobTitle: this.normalizeOptionalText(dto.jobTitle),

      email: this.normalizeOptionalEmail(dto.email),

      phone: this.normalizeOptionalText(dto.phone),

      mobile: this.normalizeOptionalText(dto.mobile),

      source: this.normalizeOptionalText(dto.source),

      status: dto.status ?? 'NEW',

      ownerUserId: dto.ownerUserId,

      notes: this.normalizeOptionalText(dto.notes),
    });

    return LeadResponseDto.fromEntity(created);
  }

  async update(
    tenantId: string,
    leadId: string,
    actorUserId: string,
    dto: UpdateLeadDto,
  ): Promise<LeadResponseDto> {
    const existing = await this.leadsRepository.findById(tenantId, leadId);

    if (!existing) {
      throw new NotFoundException('Lead not found');
    }

    if (dto.ownerUserId !== undefined) {
      await this.ensureOwnerValid(tenantId, dto.ownerUserId);
    }

    const updated = await this.leadsRepository.update(
      tenantId,
      leadId,
      actorUserId,
      {
        firstName:
          dto.firstName !== undefined ? dto.firstName.trim() : undefined,

        lastName: dto.lastName !== undefined ? dto.lastName.trim() : undefined,

        companyName: this.normalizeOptionalNullableText(dto.companyName),

        jobTitle: this.normalizeOptionalNullableText(dto.jobTitle),

        email: this.normalizeOptionalNullableEmail(dto.email),

        phone: this.normalizeOptionalNullableText(dto.phone),

        mobile: this.normalizeOptionalNullableText(dto.mobile),

        source: this.normalizeOptionalNullableText(dto.source),

        status: dto.status,

        ownerUserId: dto.ownerUserId,

        notes: this.normalizeOptionalNullableText(dto.notes),
      },
    );

    if (!updated) {
      throw new NotFoundException('Lead not found');
    }

    return LeadResponseDto.fromEntity(updated);
  }

  async updateStatus(
    tenantId: string,
    leadId: string,
    actorUserId: string,
    status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'DISQUALIFIED',
  ): Promise<LeadResponseDto> {
    const updated = await this.leadsRepository.updateStatus(
      tenantId,
      leadId,
      actorUserId,
      status,
    );

    if (!updated) {
      throw new NotFoundException('Lead not found');
    }

    return LeadResponseDto.fromEntity(updated);
  }

  async archive(
    tenantId: string,
    leadId: string,
    actorUserId: string,
  ): Promise<void> {
    const archived = await this.leadsRepository.archive(
      tenantId,
      leadId,
      actorUserId,
    );

    if (!archived) {
      throw new NotFoundException('Lead not found');
    }
  }

  private async ensureOwnerValid(
    tenantId: string,
    ownerUserId: string,
  ): Promise<void> {
    const exists = await this.leadsRepository.ownerExists(
      tenantId,
      ownerUserId,
    );

    if (!exists) {
      throw new BadRequestException(
        'Lead owner must be an active user in this organization',
      );
    }
  }

  private normalizeOptionalText(value: string | undefined): string | undefined {
    if (value === undefined) {
      return undefined;
    }

    const normalized = value.trim();

    return normalized.length > 0 ? normalized : undefined;
  }

  private normalizeOptionalEmail(
    value: string | undefined,
  ): string | undefined {
    const normalized = this.normalizeOptionalText(value);

    return normalized?.toLowerCase();
  }

  private normalizeOptionalNullableText(
    value: string | undefined,
  ): string | null | undefined {
    if (value === undefined) {
      return undefined;
    }

    const normalized = value.trim();

    return normalized.length > 0 ? normalized : null;
  }

  private normalizeOptionalNullableEmail(
    value: string | undefined,
  ): string | null | undefined {
    const normalized = this.normalizeOptionalNullableText(value);

    return typeof normalized === 'string'
      ? normalized.toLowerCase()
      : normalized;
  }
}
