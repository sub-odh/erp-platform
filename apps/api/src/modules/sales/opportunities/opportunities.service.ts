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

import { ChangeOpportunityStageDto } from './dto/change-opportunity-stage.dto';
import { CreateOpportunityDto } from './dto/create-opportunity.dto';
import { ListOpportunitiesQueryDto } from './dto/list-opportunities-query.dto';
import { OpportunityResponseDto } from './dto/opportunity-response.dto';
import { UpdateOpportunityDto } from './dto/update-opportunity.dto';
import { OpportunitiesRepository } from './opportunities.repository';

@Injectable()
export class OpportunitiesService {
  constructor(
    private readonly opportunitiesRepository: OpportunitiesRepository,
  ) {}

  async list(
    tenantId: string,
    query: ListOpportunitiesQueryDto,
  ): Promise<PaginatedResult<OpportunityResponseDto>> {
    const result = await this.opportunitiesRepository.list({
      tenantId,

      search: query.search,

      status: query.status,

      recordState: query.recordState,

      stageId: query.stageId,

      ownerUserId: query.ownerUserId,

      customerId: query.customerId,

      leadId: query.leadId,

      page: query.page,

      limit: query.limit,

      sortBy: query.sortBy,

      sortDirection: query.sortDirection,
    });

    return createPaginatedResult(
      result.data.map((opportunity) =>
        OpportunityResponseDto.fromEntity(opportunity),
      ),

      query.page,

      query.limit,

      result.total,
    );
  }

  async findById(
    tenantId: string,
    opportunityId: string,
  ): Promise<OpportunityResponseDto> {
    const opportunity = await this.opportunitiesRepository.findById(
      tenantId,
      opportunityId,
    );

    if (!opportunity) {
      throw new NotFoundException('Opportunity not found');
    }

    return OpportunityResponseDto.fromEntity(opportunity);
  }

  async create(
    tenantId: string,
    actorUserId: string,
    dto: CreateOpportunityDto,
  ): Promise<OpportunityResponseDto> {
    const stage = await this.ensureStageValid(tenantId, dto.stageId);

    if (stage.isClosed) {
      throw new BadRequestException(
        'New opportunities must start in an open pipeline stage',
      );
    }

    await this.validateRelationships(tenantId, {
      customerId: dto.customerId,

      leadId: dto.leadId,

      ownerUserId: dto.ownerUserId,
    });

    const probability = dto.probability ?? stage.probability;

    const created = await this.opportunitiesRepository.create({
      tenantId,

      actorUserId,

      name: dto.name.trim(),

      customerId: dto.customerId,

      leadId: dto.leadId,

      stageId: stage.id,

      ownerUserId: dto.ownerUserId,

      amount: dto.amount ?? 0,

      probability,

      expectedCloseDate: dto.expectedCloseDate,

      status: 'OPEN',

      description: this.normalizeOptionalText(dto.description),
    });

    return OpportunityResponseDto.fromEntity(created);
  }

  async update(
    tenantId: string,
    opportunityId: string,
    actorUserId: string,
    dto: UpdateOpportunityDto,
  ): Promise<OpportunityResponseDto> {
    const existing = await this.opportunitiesRepository.findById(
      tenantId,
      opportunityId,
    );

    if (!existing) {
      throw new NotFoundException('Opportunity not found');
    }

    await this.validateRelationships(tenantId, {
      customerId: dto.customerId,

      leadId: dto.leadId,

      ownerUserId: dto.ownerUserId,
    });

    const updated = await this.opportunitiesRepository.update(
      tenantId,
      opportunityId,
      actorUserId,
      {
        name: dto.name !== undefined ? dto.name.trim() : undefined,

        customerId: dto.customerId,

        leadId: dto.leadId,

        ownerUserId: dto.ownerUserId,

        amount: dto.amount,

        probability: dto.probability,

        expectedCloseDate: dto.expectedCloseDate,

        description: this.normalizeOptionalNullableText(dto.description),
      },
    );

    if (!updated) {
      throw new NotFoundException('Opportunity not found');
    }

    return OpportunityResponseDto.fromEntity(updated);
  }

  async changeStage(
    tenantId: string,
    opportunityId: string,
    actorUserId: string,
    dto: ChangeOpportunityStageDto,
  ): Promise<OpportunityResponseDto> {
    const existing = await this.opportunitiesRepository.findById(
      tenantId,
      opportunityId,
    );

    if (!existing) {
      throw new NotFoundException('Opportunity not found');
    }

    const stage = await this.ensureStageValid(tenantId, dto.stageId);

    let status: 'OPEN' | 'WON' | 'LOST';

    let closedAt: Date | null;

    let lossReason: string | null;

    if (!stage.isClosed) {
      status = 'OPEN';

      closedAt = null;

      lossReason = null;
    } else if (stage.isWon) {
      status = 'WON';

      closedAt = new Date();

      lossReason = null;
    } else {
      status = 'LOST';

      closedAt = new Date();

      lossReason = dto.lossReason?.trim() ?? '';

      if (!lossReason) {
        throw new BadRequestException(
          'Loss reason is required when moving an opportunity to a lost stage',
        );
      }
    }

    const updated = await this.opportunitiesRepository.changeStage(
      tenantId,
      opportunityId,
      actorUserId,
      {
        stageId: stage.id,

        probability: stage.probability,

        status,

        lossReason,

        closedAt,
      },
    );

    if (!updated) {
      throw new NotFoundException('Opportunity not found');
    }

    return OpportunityResponseDto.fromEntity(updated);
  }

  async archive(
    tenantId: string,
    opportunityId: string,
    actorUserId: string,
  ): Promise<void> {
    const archived = await this.opportunitiesRepository.archive(
      tenantId,
      opportunityId,
      actorUserId,
    );

    if (!archived) {
      throw new NotFoundException('Opportunity not found');
    }
  }

  async restore(
    tenantId: string,
    opportunityId: string,
    actorUserId: string,
  ): Promise<OpportunityResponseDto> {
    const existing =
      await this.opportunitiesRepository.findByIdIncludingArchived(
        tenantId,
        opportunityId,
      );

    if (!existing) {
      throw new NotFoundException('Opportunity not found');
    }

    if (!existing.deletedAt) {
      throw new ConflictException('Opportunity is not archived');
    }

    const restored = await this.opportunitiesRepository.restore(
      tenantId,
      opportunityId,
      actorUserId,
    );

    if (!restored) {
      throw new NotFoundException('Opportunity not found');
    }

    return OpportunityResponseDto.fromEntity(restored);
  }

  async permanentDelete(
    tenantId: string,
    opportunityId: string,
  ): Promise<void> {
    const existing =
      await this.opportunitiesRepository.findByIdIncludingArchived(
        tenantId,
        opportunityId,
      );

    if (!existing) {
      throw new NotFoundException('Opportunity not found');
    }

    if (!existing.deletedAt) {
      throw new ConflictException(
        'Opportunity must be archived before permanent deletion',
      );
    }

    const deleted = await this.opportunitiesRepository.permanentDelete(
      tenantId,
      opportunityId,
    );

    if (!deleted) {
      throw new NotFoundException('Opportunity not found');
    }
  }

  private async ensureStageValid(tenantId: string, stageId: string) {
    const stage = await this.opportunitiesRepository.findStage(
      tenantId,
      stageId,
    );

    if (!stage) {
      throw new BadRequestException(
        'Pipeline stage must be active and belong to this organization',
      );
    }

    return stage;
  }

  private async validateRelationships(
    tenantId: string,
    input: {
      customerId?: string;

      leadId?: string;

      ownerUserId?: string;
    },
  ): Promise<void> {
    if (input.customerId) {
      const customer = await this.opportunitiesRepository.findCustomer(
        tenantId,
        input.customerId,
      );

      if (!customer) {
        throw new BadRequestException(
          'Customer must be active and belong to this organization',
        );
      }
    }

    if (input.leadId) {
      const lead = await this.opportunitiesRepository.findLead(
        tenantId,
        input.leadId,
      );

      if (!lead) {
        throw new BadRequestException('Lead must belong to this organization');
      }
    }

    if (input.ownerUserId) {
      const ownerExists = await this.opportunitiesRepository.ownerExists(
        tenantId,
        input.ownerUserId,
      );

      if (!ownerExists) {
        throw new BadRequestException(
          'Opportunity owner must be an active user in this organization',
        );
      }
    }
  }

  private normalizeOptionalText(value: string | undefined): string | undefined {
    if (value === undefined) {
      return undefined;
    }

    const normalized = value.trim();

    return normalized.length > 0 ? normalized : undefined;
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
}
