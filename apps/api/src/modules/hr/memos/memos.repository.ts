import { Injectable } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import {
  db,
  hrEmployees,
  hrMemoAttachments,
  hrMemos,
  type HrMemo,
  type HrMemoAttachment,
  type NewHrMemo,
  type NewHrMemoAttachment,
} from '@erp/db';

const raisedByEmployee = alias(hrEmployees, 'memo_raised_by');
const verifierEmployee = alias(hrEmployees, 'memo_verifier');
const verifierSignedEmployee = alias(hrEmployees, 'memo_verifier_signed');
const hodSignedEmployee = alias(hrEmployees, 'memo_hod_signed');
const ceoSignedEmployee = alias(hrEmployees, 'memo_ceo_signed');

export interface MemoRecord {
  memo: HrMemo;
  raisedByFirstName: string;
  raisedByLastName: string;
  verifierFirstName: string | null;
  verifierLastName: string | null;
  verifierSignedFirstName: string | null;
  verifierSignedLastName: string | null;
  hodSignedFirstName: string | null;
  hodSignedLastName: string | null;
  ceoSignedFirstName: string | null;
  ceoSignedLastName: string | null;
}

@Injectable()
export class MemosRepository {
  async list(tenantId: string): Promise<MemoRecord[]> {
    const rows = await this.query().where(eq(hrMemos.tenantId, tenantId));
    return rows.map((row) => this.toRecord(row));
  }

  async findById(tenantId: string, memoId: string): Promise<MemoRecord | null> {
    const [row] = await this.query()
      .where(and(eq(hrMemos.id, memoId), eq(hrMemos.tenantId, tenantId)))
      .limit(1);

    return row ? this.toRecord(row) : null;
  }

  async create(values: NewHrMemo): Promise<HrMemo> {
    const [row] = await db.insert(hrMemos).values(values).returning();

    if (!row) {
      throw new Error('MEMO_CREATE_FAILED');
    }

    return row;
  }

  async update(
    tenantId: string,
    memoId: string,
    values: Partial<NewHrMemo>,
  ): Promise<HrMemo | null> {
    const [row] = await db
      .update(hrMemos)
      .set({ ...values, updatedAt: new Date() })
      .where(and(eq(hrMemos.id, memoId), eq(hrMemos.tenantId, tenantId)))
      .returning();

    return row ?? null;
  }

  listAttachments(
    tenantId: string,
    memoId: string,
  ): Promise<HrMemoAttachment[]> {
    return db
      .select()
      .from(hrMemoAttachments)
      .where(
        and(
          eq(hrMemoAttachments.tenantId, tenantId),
          eq(hrMemoAttachments.memoId, memoId),
        ),
      )
      .orderBy(desc(hrMemoAttachments.createdAt));
  }

  async createAttachment(
    values: NewHrMemoAttachment,
  ): Promise<HrMemoAttachment> {
    const [row] = await db.insert(hrMemoAttachments).values(values).returning();

    if (!row) {
      throw new Error('MEMO_ATTACHMENT_CREATE_FAILED');
    }

    return row;
  }

  private query() {
    return db
      .select({
        memo: hrMemos,
        raisedByFirstName: raisedByEmployee.firstName,
        raisedByLastName: raisedByEmployee.lastName,
        verifierFirstName: verifierEmployee.firstName,
        verifierLastName: verifierEmployee.lastName,
        verifierSignedFirstName: verifierSignedEmployee.firstName,
        verifierSignedLastName: verifierSignedEmployee.lastName,
        hodSignedFirstName: hodSignedEmployee.firstName,
        hodSignedLastName: hodSignedEmployee.lastName,
        ceoSignedFirstName: ceoSignedEmployee.firstName,
        ceoSignedLastName: ceoSignedEmployee.lastName,
      })
      .from(hrMemos)
      .innerJoin(raisedByEmployee, eq(hrMemos.raisedBy, raisedByEmployee.id))
      .leftJoin(verifierEmployee, eq(hrMemos.verifierId, verifierEmployee.id))
      .leftJoin(
        verifierSignedEmployee,
        eq(hrMemos.verifierSignedBy, verifierSignedEmployee.id),
      )
      .leftJoin(hodSignedEmployee, eq(hrMemos.hodSignedBy, hodSignedEmployee.id))
      .leftJoin(ceoSignedEmployee, eq(hrMemos.ceoSignedBy, ceoSignedEmployee.id))
      .orderBy(desc(hrMemos.createdAt));
  }

  private toRecord(row: {
    memo: HrMemo;
    raisedByFirstName: string;
    raisedByLastName: string;
    verifierFirstName: string | null;
    verifierLastName: string | null;
    verifierSignedFirstName: string | null;
    verifierSignedLastName: string | null;
    hodSignedFirstName: string | null;
    hodSignedLastName: string | null;
    ceoSignedFirstName: string | null;
    ceoSignedLastName: string | null;
  }): MemoRecord {
    return row;
  }
}
