import { Injectable } from '@nestjs/common';

import type { PaginatedResult } from '../../../common/pagination';

import { ChangeOpportunityStageDto } from './dto/change-opportunity-stage.dto';
import { CreateOpportunityDto } from './dto/create-opportunity.dto';
import { ListOpportunitiesQueryDto } from './dto/list-opportunities-query.dto';
import { OpportunityResponseDto } from './dto/opportunity-response.dto';
import { UpdateOpportunityDto } from './dto/update-opportunity.dto';
import { OpportunitiesService } from './opportunities.service';

@Injectable()
export class OpportunitiesFacade {
  constructor(private readonly opportunitiesService: OpportunitiesService) {}

  list(
    tenantId: string,
    query: ListOpportunitiesQueryDto,
  ): Promise<PaginatedResult<OpportunityResponseDto>> {
    return this.opportunitiesService.list(tenantId, query);
  }

  findById(
    tenantId: string,
    opportunityId: string,
  ): Promise<OpportunityResponseDto> {
    return this.opportunitiesService.findById(tenantId, opportunityId);
  }

  create(
    tenantId: string,
    actorUserId: string,
    dto: CreateOpportunityDto,
  ): Promise<OpportunityResponseDto> {
    return this.opportunitiesService.create(tenantId, actorUserId, dto);
  }

  update(
    tenantId: string,
    opportunityId: string,
    actorUserId: string,
    dto: UpdateOpportunityDto,
  ): Promise<OpportunityResponseDto> {
    return this.opportunitiesService.update(
      tenantId,
      opportunityId,
      actorUserId,
      dto,
    );
  }

  changeStage(
    tenantId: string,
    opportunityId: string,
    actorUserId: string,
    dto: ChangeOpportunityStageDto,
  ): Promise<OpportunityResponseDto> {
    return this.opportunitiesService.changeStage(
      tenantId,
      opportunityId,
      actorUserId,
      dto,
    );
  }

  archive(
    tenantId: string,
    opportunityId: string,
    actorUserId: string,
  ): Promise<void> {
    return this.opportunitiesService.archive(
      tenantId,
      opportunityId,
      actorUserId,
    );
  }

  restore(
    tenantId: string,
    opportunityId: string,
    actorUserId: string,
  ): Promise<OpportunityResponseDto> {
    return this.opportunitiesService.restore(
      tenantId,
      opportunityId,
      actorUserId,
    );
  }

  permanentDelete(tenantId: string, opportunityId: string): Promise<void> {
    return this.opportunitiesService.permanentDelete(tenantId, opportunityId);
  }
}
