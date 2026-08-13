import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  createPaginatedResult,
  type PaginatedResult,
} from '../../../common/pagination';

import { ConvertLeadDto } from './dto/convert-lead.dto';
import { ConvertLeadResponseDto } from './dto/convert-lead-response.dto';
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

      recordState: query.recordState,

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

    /*
     * Converted Leads may still have their
     * contact information updated, but their
     * conversion state cannot be reversed
     * through normal Lead editing.
     */
    const status = existing.status === 'CONVERTED' ? undefined : dto.status;

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

        status,

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
    const existing = await this.leadsRepository.findById(tenantId, leadId);

    if (!existing) {
      throw new NotFoundException('Lead not found');
    }

    if (existing.status === 'CONVERTED') {
      throw new ConflictException(
        'Converted leads cannot be moved back to a lead status',
      );
    }

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

  async convert(
    tenantId: string,
    leadId: string,
    actorUserId: string,
    dto: ConvertLeadDto,
  ): Promise<ConvertLeadResponseDto> {
    const lead = await this.leadsRepository.findById(tenantId, leadId);

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    if (lead.status === 'CONVERTED' || lead.convertedAt) {
      throw new ConflictException('Lead has already been converted');
    }

    if (lead.status !== 'QUALIFIED') {
      throw new BadRequestException(
        'Only qualified leads can be converted to opportunities',
      );
    }

    const existingOpportunity =
      await this.leadsRepository.findOpportunityByLeadId(tenantId, leadId);

    if (existingOpportunity) {
      throw new ConflictException(
        'An opportunity already exists for this lead',
      );
    }

    const stage = await this.leadsRepository.findStage(tenantId, dto.stageId);

    if (!stage) {
      throw new BadRequestException(
        'Pipeline stage must be active and belong to this organization',
      );
    }

    if (stage.isClosed) {
      throw new BadRequestException(
        'Converted leads must enter an open pipeline stage',
      );
    }

    if (dto.customerId) {
      const customer = await this.leadsRepository.findCustomer(
        tenantId,
        dto.customerId,
      );

      if (!customer) {
        throw new BadRequestException(
          'Customer must be active and belong to this organization',
        );
      }
    }

    /*
     * Explicit conversion owner takes priority.
     * Otherwise preserve the existing Lead owner.
     */
    const ownerUserId = dto.ownerUserId ?? lead.ownerUserId ?? undefined;

    if (ownerUserId) {
      await this.ensureOwnerValid(tenantId, ownerUserId);
    }

    const converted = await this.leadsRepository.convertQualifiedLead({
      tenantId,

      leadId,

      actorUserId,

      name: dto.name.trim(),

      customerId: dto.customerId,

      stageId: stage.id,

      ownerUserId,

      amount: dto.amount ?? 0,

      probability: stage.probability,

      expectedCloseDate: dto.expectedCloseDate,

      description: this.normalizeOptionalText(dto.description),
    });

    /*
     * The repository performs a conditional
     * QUALIFIED -> CONVERTED update.
     *
     * If another request converted the Lead
     * first, the repository returns undefined.
     */
    if (!converted) {
      throw new ConflictException(
        'Lead is no longer qualified or has already been converted',
      );
    }

    return ConvertLeadResponseDto.fromEntities(
      converted.lead,
      converted.opportunity,
    );
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

  async restore(
    tenantId: string,
    leadId: string,
    actorUserId: string,
  ): Promise<LeadResponseDto> {
    const existing = await this.leadsRepository.findByIdIncludingArchived(
      tenantId,
      leadId,
    );

    if (!existing) {
      throw new NotFoundException('Lead not found');
    }

    if (!existing.deletedAt) {
      throw new ConflictException('Lead is not archived');
    }

    const restored = await this.leadsRepository.restore(
      tenantId,
      leadId,
      actorUserId,
    );

    if (!restored) {
      throw new NotFoundException('Lead not found');
    }

    return LeadResponseDto.fromEntity(restored);
  }

  async permanentDelete(tenantId: string, leadId: string): Promise<void> {
    const existing = await this.leadsRepository.findByIdIncludingArchived(
      tenantId,
      leadId,
    );

    if (!existing) {
      throw new NotFoundException('Lead not found');
    }

    /*
     * Permanent deletion requires explicit
     * archive first.
     */
    if (!existing.deletedAt) {
      throw new ConflictException(
        'Lead must be archived before permanent deletion',
      );
    }

    /*
     * Preserve CRM source history.
     *
     * We do not allow permanent deletion when
     * an Opportunity still references this Lead.
     */
    const linkedOpportunity =
      await this.leadsRepository.findOpportunityByLeadId(tenantId, leadId);

    if (linkedOpportunity) {
      throw new ConflictException(
        'Lead cannot be permanently deleted while an opportunity references it',
      );
    }

    const deleted = await this.leadsRepository.permanentDelete(
      tenantId,
      leadId,
    );

    if (!deleted) {
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
