import type { SalesLead, SalesOpportunity } from '@erp/db';

import { LeadResponseDto } from './lead-response.dto';

export class ConvertedOpportunitySummaryDto {
  id!: string;

  name!: string;

  leadId!: string | null;

  customerId!: string | null;

  stageId!: string;

  ownerUserId!: string | null;

  amount!: string;

  probability!: number;

  expectedCloseDate!: string | null;

  status!: 'OPEN' | 'WON' | 'LOST';

  createdAt!: Date;

  static fromEntity(
    opportunity: SalesOpportunity,
  ): ConvertedOpportunitySummaryDto {
    return {
      id: opportunity.id,

      name: opportunity.name,

      leadId: opportunity.leadId,

      customerId: opportunity.customerId,

      stageId: opportunity.stageId,

      ownerUserId: opportunity.ownerUserId,

      amount: opportunity.amount,

      probability: opportunity.probability,

      expectedCloseDate: opportunity.expectedCloseDate,

      status: opportunity.status,

      createdAt: opportunity.createdAt,
    };
  }
}

export class ConvertLeadResponseDto {
  lead!: LeadResponseDto;

  opportunity!: ConvertedOpportunitySummaryDto;

  static fromEntities(
    lead: SalesLead,
    opportunity: SalesOpportunity,
  ): ConvertLeadResponseDto {
    return {
      lead: LeadResponseDto.fromEntity(lead),

      opportunity: ConvertedOpportunitySummaryDto.fromEntity(opportunity),
    };
  }
}
