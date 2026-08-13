import { Injectable } from '@nestjs/common';
import {
  and,
  asc,
  desc,
  eq,
  ilike,
  isNotNull,
  isNull,
  or,
  sql,
  type SQL,
} from 'drizzle-orm';

import {
  db,
  salesCustomers,
  salesLeads,
  salesOpportunities,
  salesPipelineStages,
  users,
  type NewSalesOpportunity,
  type SalesCustomer,
  type SalesLead,
  type SalesOpportunity,
  type SalesOpportunityStatus,
  type SalesPipelineStage,
} from '@erp/db';

import { getPaginationOffset } from '../../../common/pagination';

import type {
  OpportunityRecordState,
  OpportunitySortDirection,
  OpportunitySortField,
} from './dto/list-opportunities-query.dto';

export interface ListOpportunitiesRepositoryInput {
  tenantId: string;

  search?: string;

  status?: SalesOpportunityStatus;

  recordState: OpportunityRecordState;

  stageId?: string;

  ownerUserId?: string;

  customerId?: string;

  leadId?: string;

  page: number;

  limit: number;

  sortBy: OpportunitySortField;

  sortDirection: OpportunitySortDirection;
}

export interface ListOpportunitiesRepositoryResult {
  data: SalesOpportunity[];

  total: number;
}

export interface CreateOpportunityRepositoryInput {
  tenantId: string;

  actorUserId: string;

  name: string;

  customerId?: string;

  leadId?: string;

  stageId: string;

  ownerUserId?: string;

  amount: number;

  probability: number;

  expectedCloseDate?: string;

  status: SalesOpportunityStatus;

  description?: string;

  closedAt?: Date;
}

export interface UpdateOpportunityRepositoryInput {
  name?: string;

  customerId?: string;

  leadId?: string;

  ownerUserId?: string;

  amount?: number;

  probability?: number;

  expectedCloseDate?: string;

  description?: string | null;
}

export interface ChangeOpportunityStageRepositoryInput {
  stageId: string;

  probability: number;

  status: SalesOpportunityStatus;

  lossReason: string | null;

  closedAt: Date | null;
}

@Injectable()
export class OpportunitiesRepository {
  async list(
    input: ListOpportunitiesRepositoryInput,
  ): Promise<ListOpportunitiesRepositoryResult> {
    const conditions = this.createListConditions(input);

    const offset = getPaginationOffset({
      page: input.page,
      limit: input.limit,
    });

    const orderColumn = this.getSortColumn(input.sortBy);

    const orderExpression =
      input.sortDirection === 'asc' ? asc(orderColumn) : desc(orderColumn);

    const [data, countResult] = await Promise.all([
      db
        .select()
        .from(salesOpportunities)
        .where(and(...conditions))
        .orderBy(orderExpression)
        .limit(input.limit)
        .offset(offset),

      db
        .select({
          total: sql<number>`count(*)::int`,
        })
        .from(salesOpportunities)
        .where(and(...conditions)),
    ]);

    return {
      data,
      total: countResult[0]?.total ?? 0,
    };
  }

  async findById(
    tenantId: string,
    opportunityId: string,
  ): Promise<SalesOpportunity | undefined> {
    const [opportunity] = await db
      .select()
      .from(salesOpportunities)
      .where(
        and(
          eq(salesOpportunities.id, opportunityId),
          eq(salesOpportunities.tenantId, tenantId),
          isNull(salesOpportunities.deletedAt),
        ),
      )
      .limit(1);

    return opportunity;
  }

  async findByIdIncludingArchived(
    tenantId: string,
    opportunityId: string,
  ): Promise<SalesOpportunity | undefined> {
    const [opportunity] = await db
      .select()
      .from(salesOpportunities)
      .where(
        and(
          eq(salesOpportunities.id, opportunityId),
          eq(salesOpportunities.tenantId, tenantId),
        ),
      )
      .limit(1);

    return opportunity;
  }

  async findStage(
    tenantId: string,
    stageId: string,
  ): Promise<SalesPipelineStage | undefined> {
    const [stage] = await db
      .select()
      .from(salesPipelineStages)
      .where(
        and(
          eq(salesPipelineStages.id, stageId),
          eq(salesPipelineStages.tenantId, tenantId),
          eq(salesPipelineStages.isActive, true),
          isNull(salesPipelineStages.deletedAt),
        ),
      )
      .limit(1);

    return stage;
  }

  async findCustomer(
    tenantId: string,
    customerId: string,
  ): Promise<SalesCustomer | undefined> {
    const [customer] = await db
      .select()
      .from(salesCustomers)
      .where(
        and(
          eq(salesCustomers.id, customerId),
          eq(salesCustomers.tenantId, tenantId),
          eq(salesCustomers.isActive, true),
          isNull(salesCustomers.deletedAt),
        ),
      )
      .limit(1);

    return customer;
  }

  async findLead(
    tenantId: string,
    leadId: string,
  ): Promise<SalesLead | undefined> {
    const [lead] = await db
      .select()
      .from(salesLeads)
      .where(
        and(
          eq(salesLeads.id, leadId),
          eq(salesLeads.tenantId, tenantId),
          isNull(salesLeads.deletedAt),
        ),
      )
      .limit(1);

    return lead;
  }

  async ownerExists(tenantId: string, ownerUserId: string): Promise<boolean> {
    const [owner] = await db
      .select({
        id: users.id,
      })
      .from(users)
      .where(
        and(
          eq(users.id, ownerUserId),
          eq(users.organizationId, tenantId),
          eq(users.isActive, true),
          isNull(users.deletedAt),
        ),
      )
      .limit(1);

    return Boolean(owner);
  }

  async create(
    input: CreateOpportunityRepositoryInput,
  ): Promise<SalesOpportunity> {
    const values: NewSalesOpportunity = {
      tenantId: input.tenantId,

      name: input.name,

      customerId: input.customerId,

      leadId: input.leadId,

      stageId: input.stageId,

      ownerUserId: input.ownerUserId,

      amount: input.amount.toFixed(2),

      probability: input.probability,

      expectedCloseDate: input.expectedCloseDate,

      status: input.status,

      description: input.description,

      closedAt: input.closedAt,

      createdBy: input.actorUserId,

      updatedBy: input.actorUserId,
    };

    const [created] = await db
      .insert(salesOpportunities)
      .values(values)
      .returning();

    if (!created) {
      throw new Error('Database did not return the created opportunity');
    }

    return created;
  }

  async update(
    tenantId: string,
    opportunityId: string,
    actorUserId: string,
    input: UpdateOpportunityRepositoryInput,
  ): Promise<SalesOpportunity | undefined> {
    const values: Partial<NewSalesOpportunity> = {
      updatedBy: actorUserId,

      updatedAt: new Date(),
    };

    if (input.name !== undefined) {
      values.name = input.name;
    }

    if (input.customerId !== undefined) {
      values.customerId = input.customerId;
    }

    if (input.leadId !== undefined) {
      values.leadId = input.leadId;
    }

    if (input.ownerUserId !== undefined) {
      values.ownerUserId = input.ownerUserId;
    }

    if (input.amount !== undefined) {
      values.amount = input.amount.toFixed(2);
    }

    if (input.probability !== undefined) {
      values.probability = input.probability;
    }

    if (input.expectedCloseDate !== undefined) {
      values.expectedCloseDate = input.expectedCloseDate;
    }

    if (input.description !== undefined) {
      values.description = input.description;
    }

    const [updated] = await db
      .update(salesOpportunities)
      .set(values)
      .where(
        and(
          eq(salesOpportunities.id, opportunityId),
          eq(salesOpportunities.tenantId, tenantId),
          isNull(salesOpportunities.deletedAt),
        ),
      )
      .returning();

    return updated;
  }

  async changeStage(
    tenantId: string,
    opportunityId: string,
    actorUserId: string,
    input: ChangeOpportunityStageRepositoryInput,
  ): Promise<SalesOpportunity | undefined> {
    const [updated] = await db
      .update(salesOpportunities)
      .set({
        stageId: input.stageId,

        probability: input.probability,

        status: input.status,

        lossReason: input.lossReason,

        closedAt: input.closedAt,

        updatedBy: actorUserId,

        updatedAt: new Date(),
      })
      .where(
        and(
          eq(salesOpportunities.id, opportunityId),
          eq(salesOpportunities.tenantId, tenantId),
          isNull(salesOpportunities.deletedAt),
        ),
      )
      .returning();

    return updated;
  }

  async archive(
    tenantId: string,
    opportunityId: string,
    actorUserId: string,
  ): Promise<boolean> {
    const [archived] = await db
      .update(salesOpportunities)
      .set({
        deletedAt: new Date(),

        updatedBy: actorUserId,

        updatedAt: new Date(),
      })
      .where(
        and(
          eq(salesOpportunities.id, opportunityId),
          eq(salesOpportunities.tenantId, tenantId),
          isNull(salesOpportunities.deletedAt),
        ),
      )
      .returning({
        id: salesOpportunities.id,
      });

    return Boolean(archived);
  }

  async restore(
    tenantId: string,
    opportunityId: string,
    actorUserId: string,
  ): Promise<SalesOpportunity | undefined> {
    const [restored] = await db
      .update(salesOpportunities)
      .set({
        deletedAt: null,

        updatedBy: actorUserId,

        updatedAt: new Date(),
      })
      .where(
        and(
          eq(salesOpportunities.id, opportunityId),
          eq(salesOpportunities.tenantId, tenantId),
          isNotNull(salesOpportunities.deletedAt),
        ),
      )
      .returning();

    return restored;
  }

  async permanentDelete(
    tenantId: string,
    opportunityId: string,
  ): Promise<boolean> {
    const [deleted] = await db
      .delete(salesOpportunities)
      .where(
        and(
          eq(salesOpportunities.id, opportunityId),
          eq(salesOpportunities.tenantId, tenantId),
          isNotNull(salesOpportunities.deletedAt),
        ),
      )
      .returning({
        id: salesOpportunities.id,
      });

    return Boolean(deleted);
  }

  private createListConditions(input: ListOpportunitiesRepositoryInput): SQL[] {
    const conditions: SQL[] = [eq(salesOpportunities.tenantId, input.tenantId)];

    switch (input.recordState) {
      case 'archived':
        conditions.push(isNotNull(salesOpportunities.deletedAt));

        break;

      case 'all':
        break;

      case 'active':
      default:
        conditions.push(isNull(salesOpportunities.deletedAt));

        break;
    }

    if (input.status) {
      conditions.push(eq(salesOpportunities.status, input.status));
    }

    if (input.stageId) {
      conditions.push(eq(salesOpportunities.stageId, input.stageId));
    }

    if (input.ownerUserId) {
      conditions.push(eq(salesOpportunities.ownerUserId, input.ownerUserId));
    }

    if (input.customerId) {
      conditions.push(eq(salesOpportunities.customerId, input.customerId));
    }

    if (input.leadId) {
      conditions.push(eq(salesOpportunities.leadId, input.leadId));
    }

    const search = input.search?.trim();

    if (search) {
      const pattern = `%${search}%`;

      const condition = or(
        ilike(salesOpportunities.name, pattern),

        ilike(salesOpportunities.description, pattern),

        ilike(salesOpportunities.lossReason, pattern),
      );

      if (condition) {
        conditions.push(condition);
      }
    }

    return conditions;
  }

  private getSortColumn(sortBy: OpportunitySortField) {
    switch (sortBy) {
      case 'name':
        return salesOpportunities.name;

      case 'amount':
        return salesOpportunities.amount;

      case 'probability':
        return salesOpportunities.probability;

      case 'expectedCloseDate':
        return salesOpportunities.expectedCloseDate;

      case 'updatedAt':
        return salesOpportunities.updatedAt;

      case 'createdAt':
      default:
        return salesOpportunities.createdAt;
    }
  }
}
