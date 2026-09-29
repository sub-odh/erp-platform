import { Injectable } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';

import {
  db,
  officeAssets,
  type NewOfficeAsset,
  type OfficeAsset,
} from '@erp/db';

@Injectable()
export class OfficeAssetsRepository {
  list(tenantId: string): Promise<OfficeAsset[]> {
    return db
      .select()
      .from(officeAssets)
      .where(eq(officeAssets.tenantId, tenantId))
      .orderBy(desc(officeAssets.createdAt));
  }

  async findById(
    tenantId: string,
    assetId: string,
  ): Promise<OfficeAsset | null> {
    const [row] = await db
      .select()
      .from(officeAssets)
      .where(
        and(eq(officeAssets.tenantId, tenantId), eq(officeAssets.id, assetId)),
      )
      .limit(1);

    return row ?? null;
  }

  async create(values: NewOfficeAsset): Promise<OfficeAsset> {
    const [created] = await db.insert(officeAssets).values(values).returning();

    return created;
  }

  async update(
    tenantId: string,
    assetId: string,
    values: Partial<NewOfficeAsset>,
  ): Promise<OfficeAsset | null> {
    const [updated] = await db
      .update(officeAssets)
      .set({ ...values, updatedAt: new Date() })
      .where(
        and(eq(officeAssets.tenantId, tenantId), eq(officeAssets.id, assetId)),
      )
      .returning();

    return updated ?? null;
  }

  async delete(tenantId: string, assetId: string): Promise<boolean> {
    const deleted = await db
      .delete(officeAssets)
      .where(
        and(eq(officeAssets.tenantId, tenantId), eq(officeAssets.id, assetId)),
      )
      .returning({ id: officeAssets.id });

    return deleted.length > 0;
  }
}
