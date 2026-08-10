import { Injectable } from '@nestjs/common';

import type { PaginatedResult } from '../../../common/pagination';

import { CreateLeadDto } from './dto/create-lead.dto';
import { LeadResponseDto } from './dto/lead-response.dto';
import { ListLeadsQueryDto } from './dto/list-leads-query.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { LeadsService } from './leads.service';

@Injectable()
export class LeadsFacade {
  constructor(private readonly leadsService: LeadsService) {}

  list(
    tenantId: string,
    query: ListLeadsQueryDto,
  ): Promise<PaginatedResult<LeadResponseDto>> {
    return this.leadsService.list(tenantId, query);
  }

  findById(tenantId: string, leadId: string): Promise<LeadResponseDto> {
    return this.leadsService.findById(tenantId, leadId);
  }

  create(
    tenantId: string,
    actorUserId: string,
    dto: CreateLeadDto,
  ): Promise<LeadResponseDto> {
    return this.leadsService.create(tenantId, actorUserId, dto);
  }

  update(
    tenantId: string,
    leadId: string,
    actorUserId: string,
    dto: UpdateLeadDto,
  ): Promise<LeadResponseDto> {
    return this.leadsService.update(tenantId, leadId, actorUserId, dto);
  }

  updateStatus(
    tenantId: string,
    leadId: string,
    actorUserId: string,
    status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'DISQUALIFIED',
  ): Promise<LeadResponseDto> {
    return this.leadsService.updateStatus(
      tenantId,
      leadId,
      actorUserId,
      status,
    );
  }

  archive(
    tenantId: string,
    leadId: string,
    actorUserId: string,
  ): Promise<void> {
    return this.leadsService.archive(tenantId, leadId, actorUserId);
  }
}
