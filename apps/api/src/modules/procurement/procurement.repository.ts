import { Injectable } from '@nestjs/common';
import {
  and,
  asc,
  desc,
  eq,
  gte,
  ilike,
  isNull,
  lte,
  or,
  type SQL,
} from 'drizzle-orm';

import { db, procurementGuarantees, procurementTenders } from '@erp/db';

import type { CreateTenderDto, UpdateTenderDto } from './dto/tender.dto';
import type {
  CreateGuaranteeDto,
  ListGuaranteesQueryDto,
  ReleaseGuaranteeDto,
  UpdateGuaranteeDto,
} from './dto/guarantee.dto';

@Injectable()
export class ProcurementRepository {
  listTenders(input: {
    tenantId: string;
    search?: string;
    fromDate?: string;
    toDate?: string;
  }) {
    const conditions: SQL[] = [
      eq(procurementTenders.tenantId, input.tenantId),
      isNull(procurementTenders.deletedAt),
    ];

    if (input.search) {
      const pattern = `%${input.search}%`;
      const match = or(
        ilike(procurementTenders.title, pattern),
        ilike(procurementTenders.details, pattern),
      );
      if (match) conditions.push(match);
    }

    if (input.fromDate) {
      conditions.push(gte(procurementTenders.submissionDate, input.fromDate));
    }

    if (input.toDate) {
      conditions.push(lte(procurementTenders.submissionDate, input.toDate));
    }

    return db
      .select()
      .from(procurementTenders)
      .where(and(...conditions))
      .orderBy(asc(procurementTenders.submissionDate));
  }

  async findTender(tenantId: string, id: string) {
    const [row] = await db
      .select()
      .from(procurementTenders)
      .where(
        and(
          eq(procurementTenders.tenantId, tenantId),
          eq(procurementTenders.id, id),
          isNull(procurementTenders.deletedAt),
        ),
      )
      .limit(1);
    return row ?? null;
  }

  async createTender(tenantId: string, userId: string, dto: CreateTenderDto) {
    const [row] = await db
      .insert(procurementTenders)
      .values({
        tenantId,
        title: dto.title.trim(),
        submissionDate: dto.submissionDate,
        closingDate: dto.closingDate ?? null,
        details: dto.details?.trim() ?? null,
        createdBy: userId,
        updatedBy: userId,
      })
      .returning();
    return row;
  }

  async updateTender(
    tenantId: string,
    id: string,
    userId: string,
    dto: UpdateTenderDto,
  ) {
    const [row] = await db
      .update(procurementTenders)
      .set({
        ...(dto.title === undefined ? {} : { title: dto.title.trim() }),
        ...(dto.submissionDate === undefined
          ? {}
          : { submissionDate: dto.submissionDate }),
        ...(dto.closingDate === undefined
          ? {}
          : { closingDate: dto.closingDate }),
        ...(dto.details === undefined
          ? {}
          : { details: dto.details?.trim() ?? null }),
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(procurementTenders.tenantId, tenantId),
          eq(procurementTenders.id, id),
          isNull(procurementTenders.deletedAt),
        ),
      )
      .returning();
    return row ?? null;
  }

  async softDeleteTender(tenantId: string, id: string, userId: string) {
    const [row] = await db
      .update(procurementTenders)
      .set({ deletedAt: new Date(), updatedBy: userId })
      .where(
        and(
          eq(procurementTenders.tenantId, tenantId),
          eq(procurementTenders.id, id),
          isNull(procurementTenders.deletedAt),
        ),
      )
      .returning();
    return row ?? null;
  }

  listGuarantees(input: { tenantId: string } & ListGuaranteesQueryDto) {
    const conditions: SQL[] = [
      eq(procurementGuarantees.tenantId, input.tenantId),
      isNull(procurementGuarantees.deletedAt),
    ];

    if (input.search) {
      const pattern = `%${input.search}%`;
      const match = or(
        ilike(procurementGuarantees.clientName, pattern),
        ilike(procurementGuarantees.bankNameBranch, pattern),
        ilike(procurementGuarantees.tenderDetails, pattern),
      );
      if (match) conditions.push(match);
    }

    if (input.guaranteeType) {
      conditions.push(
        eq(procurementGuarantees.guaranteeType, input.guaranteeType),
      );
    }

    if (input.status) {
      conditions.push(eq(procurementGuarantees.status, input.status));
    }

    return db
      .select()
      .from(procurementGuarantees)
      .where(and(...conditions))
      .orderBy(
        asc(procurementGuarantees.status),
        asc(procurementGuarantees.expiryDate),
        desc(procurementGuarantees.createdAt),
      );
  }

  async findGuarantee(tenantId: string, id: string) {
    const [row] = await db
      .select()
      .from(procurementGuarantees)
      .where(
        and(
          eq(procurementGuarantees.tenantId, tenantId),
          eq(procurementGuarantees.id, id),
          isNull(procurementGuarantees.deletedAt),
        ),
      )
      .limit(1);
    return row ?? null;
  }

  async createGuarantee(
    tenantId: string,
    userId: string,
    dto: CreateGuaranteeDto,
  ) {
    const [row] = await db
      .insert(procurementGuarantees)
      .values({
        tenantId,
        guaranteeType: dto.guaranteeType,
        clientName: dto.clientName.trim(),
        tenderDetails: dto.tenderDetails.trim(),
        bankNameBranch: dto.bankNameBranch.trim(),
        amount: dto.amount.toFixed(2),
        submissionDate: dto.submissionDate,
        expiryDate: dto.expiryDate,
        assignedPerson: dto.assignedPerson?.trim() ?? null,
        documentUrl: dto.documentUrl ?? null,
        createdBy: userId,
        updatedBy: userId,
      })
      .returning();
    return row;
  }

  async updateGuarantee(
    tenantId: string,
    id: string,
    userId: string,
    dto: UpdateGuaranteeDto,
  ) {
    const [row] = await db
      .update(procurementGuarantees)
      .set({
        ...(dto.guaranteeType === undefined
          ? {}
          : { guaranteeType: dto.guaranteeType }),
        ...(dto.clientName === undefined
          ? {}
          : { clientName: dto.clientName.trim() }),
        ...(dto.tenderDetails === undefined
          ? {}
          : { tenderDetails: dto.tenderDetails.trim() }),
        ...(dto.bankNameBranch === undefined
          ? {}
          : { bankNameBranch: dto.bankNameBranch.trim() }),
        ...(dto.amount === undefined ? {} : { amount: dto.amount.toFixed(2) }),
        ...(dto.submissionDate === undefined
          ? {}
          : { submissionDate: dto.submissionDate }),
        ...(dto.expiryDate === undefined ? {} : { expiryDate: dto.expiryDate }),
        ...(dto.assignedPerson === undefined
          ? {}
          : { assignedPerson: dto.assignedPerson?.trim() ?? null }),
        ...(dto.documentUrl === undefined
          ? {}
          : { documentUrl: dto.documentUrl }),
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(procurementGuarantees.tenantId, tenantId),
          eq(procurementGuarantees.id, id),
          isNull(procurementGuarantees.deletedAt),
        ),
      )
      .returning();
    return row ?? null;
  }

  async releaseGuarantee(
    tenantId: string,
    id: string,
    userId: string,
    dto: ReleaseGuaranteeDto,
  ) {
    const [row] = await db
      .update(procurementGuarantees)
      .set({
        status: 'RELEASED',
        releaseDate: dto.releaseDate,
        releaseRemarks: dto.releaseRemarks?.trim() ?? null,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(procurementGuarantees.tenantId, tenantId),
          eq(procurementGuarantees.id, id),
          eq(procurementGuarantees.status, 'ACTIVE'),
          isNull(procurementGuarantees.deletedAt),
        ),
      )
      .returning();
    return row ?? null;
  }

  async softDeleteGuarantee(tenantId: string, id: string, userId: string) {
    const [row] = await db
      .update(procurementGuarantees)
      .set({ deletedAt: new Date(), updatedBy: userId })
      .where(
        and(
          eq(procurementGuarantees.tenantId, tenantId),
          eq(procurementGuarantees.id, id),
          isNull(procurementGuarantees.deletedAt),
        ),
      )
      .returning();
    return row ?? null;
  }
}
