import { Injectable } from '@nestjs/common';
import { and, asc, eq, isNull } from 'drizzle-orm';

import {
  db,
  salesPipelineStages,
  type NewSalesPipelineStage,
  type SalesPipelineStage,
} from '@erp/db';

export interface CreatePipelineStageRepositoryInput {
  tenantId: string;
  actorUserId: string;
  name: string;
  position: number;
  probability: number;
  isClosed: boolean;
  isWon: boolean;
  isActive: boolean;
}

export interface UpdatePipelineStageRepositoryInput {
  name?: string;
  position?: number;
  probability?: number;
  isClosed?: boolean;
  isWon?: boolean;
  isActive?: boolean;
}

@Injectable()
export class PipelineStagesRepository {
  async list(tenantId: string): Promise<SalesPipelineStage[]> {
    return db
      .select()
      .from(salesPipelineStages)
      .where(
        and(
          eq(salesPipelineStages.tenantId, tenantId),
          isNull(salesPipelineStages.deletedAt),
        ),
      )
      .orderBy(asc(salesPipelineStages.position));
  }

  async findById(
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
          isNull(salesPipelineStages.deletedAt),
        ),
      )
      .limit(1);

    return stage;
  }

  async findByName(
    tenantId: string,
    name: string,
  ): Promise<SalesPipelineStage | undefined> {
    const [stage] = await db
      .select()
      .from(salesPipelineStages)
      .where(
        and(
          eq(salesPipelineStages.tenantId, tenantId),
          eq(salesPipelineStages.name, name),
          isNull(salesPipelineStages.deletedAt),
        ),
      )
      .limit(1);

    return stage;
  }

  async findByPosition(
    tenantId: string,
    position: number,
  ): Promise<SalesPipelineStage | undefined> {
    const [stage] = await db
      .select()
      .from(salesPipelineStages)
      .where(
        and(
          eq(salesPipelineStages.tenantId, tenantId),
          eq(salesPipelineStages.position, position),
          isNull(salesPipelineStages.deletedAt),
        ),
      )
      .limit(1);

    return stage;
  }

  async create(
    input: CreatePipelineStageRepositoryInput,
  ): Promise<SalesPipelineStage> {
    const values: NewSalesPipelineStage = {
      tenantId: input.tenantId,
      name: input.name,
      position: input.position,
      probability: input.probability,
      isClosed: input.isClosed,
      isWon: input.isWon,
      isActive: input.isActive,
      createdBy: input.actorUserId,
      updatedBy: input.actorUserId,
    };

    const [createdStage] = await db
      .insert(salesPipelineStages)
      .values(values)
      .returning();

    if (!createdStage) {
      throw new Error('Database did not return the created pipeline stage');
    }

    return createdStage;
  }

  async createDefaults(
    tenantId: string,
    actorUserId: string,
  ): Promise<SalesPipelineStage[]> {
    const values: NewSalesPipelineStage[] = [
      {
        tenantId,
        name: 'Qualification',
        position: 10,
        probability: 20,
        isClosed: false,
        isWon: false,
        isActive: true,
        createdBy: actorUserId,
        updatedBy: actorUserId,
      },
      {
        tenantId,
        name: 'Proposal',
        position: 20,
        probability: 50,
        isClosed: false,
        isWon: false,
        isActive: true,
        createdBy: actorUserId,
        updatedBy: actorUserId,
      },
      {
        tenantId,
        name: 'Negotiation',
        position: 30,
        probability: 75,
        isClosed: false,
        isWon: false,
        isActive: true,
        createdBy: actorUserId,
        updatedBy: actorUserId,
      },
      {
        tenantId,
        name: 'Won',
        position: 40,
        probability: 100,
        isClosed: true,
        isWon: true,
        isActive: true,
        createdBy: actorUserId,
        updatedBy: actorUserId,
      },
      {
        tenantId,
        name: 'Lost',
        position: 50,
        probability: 0,
        isClosed: true,
        isWon: false,
        isActive: true,
        createdBy: actorUserId,
        updatedBy: actorUserId,
      },
    ];

    return db
      .insert(salesPipelineStages)
      .values(values)
      .onConflictDoNothing()
      .returning();
  }

  async update(
    tenantId: string,
    stageId: string,
    actorUserId: string,
    input: UpdatePipelineStageRepositoryInput,
  ): Promise<SalesPipelineStage | undefined> {
    const values: Partial<NewSalesPipelineStage> = {
      updatedBy: actorUserId,
      updatedAt: new Date(),
    };

    if (input.name !== undefined) {
      values.name = input.name;
    }

    if (input.position !== undefined) {
      values.position = input.position;
    }

    if (input.probability !== undefined) {
      values.probability = input.probability;
    }

    if (input.isClosed !== undefined) {
      values.isClosed = input.isClosed;
    }

    if (input.isWon !== undefined) {
      values.isWon = input.isWon;
    }

    if (input.isActive !== undefined) {
      values.isActive = input.isActive;
    }

    const [updatedStage] = await db
      .update(salesPipelineStages)
      .set(values)
      .where(
        and(
          eq(salesPipelineStages.id, stageId),
          eq(salesPipelineStages.tenantId, tenantId),
          isNull(salesPipelineStages.deletedAt),
        ),
      )
      .returning();

    return updatedStage;
  }

  async updateStatus(
    tenantId: string,
    stageId: string,
    actorUserId: string,
    isActive: boolean,
  ): Promise<SalesPipelineStage | undefined> {
    const [updatedStage] = await db
      .update(salesPipelineStages)
      .set({
        isActive,
        updatedBy: actorUserId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(salesPipelineStages.id, stageId),
          eq(salesPipelineStages.tenantId, tenantId),
          isNull(salesPipelineStages.deletedAt),
        ),
      )
      .returning();

    return updatedStage;
  }
}
