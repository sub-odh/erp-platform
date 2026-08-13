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
  type NewSalesLead,
  type NewSalesOpportunity,
  type SalesCustomer,
  type SalesLead,
  type SalesLeadStatus,
  type SalesOpportunity,
  type SalesPipelineStage,
} from '@erp/db';

import { getPaginationOffset } from '../../../common/pagination';

import type {
  LeadRecordState,
  LeadSortField,
  SortDirection,
} from './dto/list-leads-query.dto';

export interface ListLeadsRepositoryInput {
  tenantId: string;

  search?: string;

  status?: SalesLeadStatus;

  recordState: LeadRecordState;

  ownerUserId?: string;

  page: number;

  limit: number;

  sortBy: LeadSortField;

  sortDirection: SortDirection;
}

export interface ListLeadsRepositoryResult {
  data: SalesLead[];

  total: number;
}

export interface CreateLeadRepositoryInput {
  tenantId: string;

  actorUserId: string;

  firstName: string;

  lastName: string;

  companyName?: string;

  jobTitle?: string;

  email?: string;

  phone?: string;

  mobile?: string;

  source?: string;

  status: SalesLeadStatus;

  ownerUserId?: string;

  notes?: string;
}

export interface UpdateLeadRepositoryInput {
  firstName?: string;

  lastName?: string;

  companyName?: string | null;

  jobTitle?: string | null;

  email?: string | null;

  phone?: string | null;

  mobile?: string | null;

  source?: string | null;

  status?: SalesLeadStatus;

  ownerUserId?: string | null;

  notes?: string | null;
}

export interface ConvertLeadRepositoryInput {
  tenantId: string;

  leadId: string;

  actorUserId: string;

  name: string;

  customerId?: string;

  stageId: string;

  ownerUserId?: string;

  amount: number;

  probability: number;

  expectedCloseDate?: string;

  description?: string;
}

export interface ConvertLeadRepositoryResult {
  lead: SalesLead;

  opportunity: SalesOpportunity;
}

class LeadConversionStateError extends Error {}

@Injectable()
export class LeadsRepository {
  async list(
    input: ListLeadsRepositoryInput,
  ): Promise<ListLeadsRepositoryResult> {
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
        .from(salesLeads)
        .where(and(...conditions))
        .orderBy(orderExpression)
        .limit(input.limit)
        .offset(offset),

      db
        .select({
          total: sql<number>`count(*)::int`,
        })
        .from(salesLeads)
        .where(and(...conditions)),
    ]);

    return {
      data,

      total: countResult[0]?.total ?? 0,
    };
  }

  async findById(
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

  async findByIdIncludingArchived(
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
        ),
      )
      .limit(1);

    return lead;
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

  async findOpportunityByLeadId(
    tenantId: string,
    leadId: string,
  ): Promise<SalesOpportunity | undefined> {
    const [opportunity] = await db
      .select()
      .from(salesOpportunities)
      .where(
        and(
          eq(salesOpportunities.tenantId, tenantId),

          eq(salesOpportunities.leadId, leadId),
        ),
      )
      .limit(1);

    return opportunity;
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

  async create(input: CreateLeadRepositoryInput): Promise<SalesLead> {
    const values: NewSalesLead = {
      tenantId: input.tenantId,

      firstName: input.firstName,

      lastName: input.lastName,

      companyName: input.companyName,

      jobTitle: input.jobTitle,

      email: input.email,

      phone: input.phone,

      mobile: input.mobile,

      source: input.source,

      status: input.status,

      ownerUserId: input.ownerUserId,

      notes: input.notes,

      createdBy: input.actorUserId,

      updatedBy: input.actorUserId,
    };

    const [createdLead] = await db
      .insert(salesLeads)
      .values(values)
      .returning();

    if (!createdLead) {
      throw new Error('Database did not return the created lead');
    }

    return createdLead;
  }

  async update(
    tenantId: string,
    leadId: string,
    actorUserId: string,
    input: UpdateLeadRepositoryInput,
  ): Promise<SalesLead | undefined> {
    const values = this.createUpdateValues(input, actorUserId);

    const [updatedLead] = await db
      .update(salesLeads)
      .set(values)
      .where(
        and(
          eq(salesLeads.id, leadId),

          eq(salesLeads.tenantId, tenantId),

          isNull(salesLeads.deletedAt),
        ),
      )
      .returning();

    return updatedLead;
  }

  async updateStatus(
    tenantId: string,
    leadId: string,
    actorUserId: string,
    status: SalesLeadStatus,
  ): Promise<SalesLead | undefined> {
    const [updatedLead] = await db
      .update(salesLeads)
      .set({
        status,

        updatedBy: actorUserId,

        updatedAt: new Date(),
      })
      .where(
        and(
          eq(salesLeads.id, leadId),

          eq(salesLeads.tenantId, tenantId),

          isNull(salesLeads.deletedAt),
        ),
      )
      .returning();

    return updatedLead;
  }

  async convertQualifiedLead(
    input: ConvertLeadRepositoryInput,
  ): Promise<ConvertLeadRepositoryResult | undefined> {
    try {
      return await db.transaction(async (tx) => {
        const now = new Date();

        /*
         * Claim the qualified lead first.
         *
         * This conditional UPDATE also protects
         * against two conversion requests racing
         * at the same time.
         */
        const [convertedLead] = await tx
          .update(salesLeads)
          .set({
            status: 'CONVERTED',

            convertedAt: now,

            updatedBy: input.actorUserId,

            updatedAt: now,
          })
          .where(
            and(
              eq(salesLeads.id, input.leadId),

              eq(salesLeads.tenantId, input.tenantId),

              eq(salesLeads.status, 'QUALIFIED'),

              isNull(salesLeads.deletedAt),
            ),
          )
          .returning();

        if (!convertedLead) {
          throw new LeadConversionStateError();
        }

        const opportunityValues: NewSalesOpportunity = {
          tenantId: input.tenantId,

          name: input.name,

          customerId: input.customerId,

          leadId: input.leadId,

          stageId: input.stageId,

          ownerUserId: input.ownerUserId,

          amount: input.amount.toFixed(2),

          probability: input.probability,

          expectedCloseDate: input.expectedCloseDate,

          status: 'OPEN',

          description: input.description,

          createdBy: input.actorUserId,

          updatedBy: input.actorUserId,
        };

        const [opportunity] = await tx
          .insert(salesOpportunities)
          .values(opportunityValues)
          .returning();

        if (!opportunity) {
          throw new Error('Database did not return the converted opportunity');
        }

        return {
          lead: convertedLead,

          opportunity,
        };
      });
    } catch (error) {
      if (error instanceof LeadConversionStateError) {
        return undefined;
      }

      throw error;
    }
  }

  async archive(
    tenantId: string,
    leadId: string,
    actorUserId: string,
  ): Promise<boolean> {
    const [archived] = await db
      .update(salesLeads)
      .set({
        deletedAt: new Date(),

        updatedBy: actorUserId,

        updatedAt: new Date(),
      })
      .where(
        and(
          eq(salesLeads.id, leadId),

          eq(salesLeads.tenantId, tenantId),

          isNull(salesLeads.deletedAt),
        ),
      )
      .returning({
        id: salesLeads.id,
      });

    return Boolean(archived);
  }

  async restore(
    tenantId: string,
    leadId: string,
    actorUserId: string,
  ): Promise<SalesLead | undefined> {
    const [restored] = await db
      .update(salesLeads)
      .set({
        deletedAt: null,

        updatedBy: actorUserId,

        updatedAt: new Date(),
      })
      .where(
        and(
          eq(salesLeads.id, leadId),

          eq(salesLeads.tenantId, tenantId),

          isNotNull(salesLeads.deletedAt),
        ),
      )
      .returning();

    return restored;
  }

  async permanentDelete(tenantId: string, leadId: string): Promise<boolean> {
    const [deleted] = await db
      .delete(salesLeads)
      .where(
        and(
          eq(salesLeads.id, leadId),

          eq(salesLeads.tenantId, tenantId),

          isNotNull(salesLeads.deletedAt),
        ),
      )
      .returning({
        id: salesLeads.id,
      });

    return Boolean(deleted);
  }

  private createListConditions(input: ListLeadsRepositoryInput): SQL[] {
    const conditions: SQL[] = [eq(salesLeads.tenantId, input.tenantId)];

    switch (input.recordState) {
      case 'archived':
        conditions.push(isNotNull(salesLeads.deletedAt));

        break;

      case 'all':
        break;

      case 'active':
      default:
        conditions.push(isNull(salesLeads.deletedAt));

        break;
    }

    if (input.status) {
      conditions.push(eq(salesLeads.status, input.status));
    }

    if (input.ownerUserId) {
      conditions.push(eq(salesLeads.ownerUserId, input.ownerUserId));
    }

    const search = input.search?.trim();

    if (search) {
      const pattern = `%${search}%`;

      const searchCondition = or(
        ilike(salesLeads.firstName, pattern),

        ilike(salesLeads.lastName, pattern),

        ilike(salesLeads.companyName, pattern),

        ilike(salesLeads.email, pattern),

        ilike(salesLeads.phone, pattern),

        ilike(salesLeads.mobile, pattern),

        ilike(salesLeads.source, pattern),
      );

      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }

    return conditions;
  }

  private getSortColumn(sortBy: LeadSortField) {
    switch (sortBy) {
      case 'firstName':
        return salesLeads.firstName;

      case 'lastName':
        return salesLeads.lastName;

      case 'companyName':
        return salesLeads.companyName;

      case 'status':
        return salesLeads.status;

      case 'updatedAt':
        return salesLeads.updatedAt;

      case 'createdAt':
      default:
        return salesLeads.createdAt;
    }
  }

  private createUpdateValues(
    input: UpdateLeadRepositoryInput,

    actorUserId: string,
  ): Partial<NewSalesLead> {
    const values: Partial<NewSalesLead> = {
      updatedBy: actorUserId,

      updatedAt: new Date(),
    };

    if (input.firstName !== undefined) {
      values.firstName = input.firstName;
    }

    if (input.lastName !== undefined) {
      values.lastName = input.lastName;
    }

    if (input.companyName !== undefined) {
      values.companyName = input.companyName;
    }

    if (input.jobTitle !== undefined) {
      values.jobTitle = input.jobTitle;
    }

    if (input.email !== undefined) {
      values.email = input.email;
    }

    if (input.phone !== undefined) {
      values.phone = input.phone;
    }

    if (input.mobile !== undefined) {
      values.mobile = input.mobile;
    }

    if (input.source !== undefined) {
      values.source = input.source;
    }

    if (input.status !== undefined) {
      values.status = input.status;
    }

    if (input.ownerUserId !== undefined) {
      values.ownerUserId = input.ownerUserId;
    }

    if (input.notes !== undefined) {
      values.notes = input.notes;
    }

    return values;
  }
}
