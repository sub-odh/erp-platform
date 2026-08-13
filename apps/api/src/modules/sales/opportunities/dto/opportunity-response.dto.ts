import type { SalesOpportunity, SalesOpportunityStatus } from '@erp/db';

export class OpportunityResponseDto {
  id!: string;
  tenantId!: string;

  name!: string;

  customerId!: string | null;
  leadId!: string | null;

  stageId!: string;
  ownerUserId!: string | null;

  amount!: string;
  probability!: number;

  expectedCloseDate!: string | null;

  status!: SalesOpportunityStatus;

  lossReason!: string | null;
  description!: string | null;

  createdBy!: string | null;
  updatedBy!: string | null;

  createdAt!: Date;
  updatedAt!: Date;

  closedAt!: Date | null;
  deletedAt!: Date | null;

  static fromEntity(opportunity: SalesOpportunity): OpportunityResponseDto {
    return {
      id: opportunity.id,
      tenantId: opportunity.tenantId,

      name: opportunity.name,

      customerId: opportunity.customerId,
      leadId: opportunity.leadId,

      stageId: opportunity.stageId,
      ownerUserId: opportunity.ownerUserId,

      amount: opportunity.amount,
      probability: opportunity.probability,

      expectedCloseDate: opportunity.expectedCloseDate,

      status: opportunity.status,

      lossReason: opportunity.lossReason,
      description: opportunity.description,

      createdBy: opportunity.createdBy,
      updatedBy: opportunity.updatedBy,

      createdAt: opportunity.createdAt,
      updatedAt: opportunity.updatedAt,

      closedAt: opportunity.closedAt,
      deletedAt: opportunity.deletedAt,
    };
  }
}
