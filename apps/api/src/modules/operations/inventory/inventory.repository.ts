import { Injectable } from '@nestjs/common';
import {
  and,
  asc,
  desc,
  eq,
  ilike,
  isNull,
  or,
  sql,
  type SQL,
} from 'drizzle-orm';

import {
  db,
  inventoryAssets,
  inventoryMovements,
  users,
  type InventoryAsset,
  type InventoryMovementType,
  type NewInventoryAsset,
} from '@erp/db';

import { getPaginationOffset } from '../../../common/pagination';
import type {
  InventorySortDirection,
  InventorySortField,
} from './dto/list-inventory-assets-query.dto';

export interface ListInventoryAssetsInput {
  tenantId: string;
  search?: string;
  status?: InventoryAsset['status'];
  vendor?: string;
  page: number;
  limit: number;
  sortBy: InventorySortField;
  sortDirection: InventorySortDirection;
}

export interface InventoryListTotals {
  purchaseValue: number;
  mrpValue: number;
  stockQuantity: number;
}

export interface InventoryDashboardData {
  total: number;
  stock: number;
  sold: number;
  damaged: number;
  investment: number;
  marketValue: number;
  vendors: Array<{
    vendor: string;
    total: number;
    stock: number;
    sold: number;
    damaged: number;
  }>;
}

export interface InventoryMovementListRow {
  id: string;
  assetId: string;
  itemName: string;
  serialNumber: string | null;
  type: InventoryMovementType;
  quantityDelta: number;
  stockQuantityAfter: number;
  remarks: string | null;
  performedBy: string | null;
  performerName: string | null;
  createdAt: Date;
}

@Injectable()
export class InventoryRepository {
  async list(input: ListInventoryAssetsInput): Promise<{
    data: InventoryAsset[];
    total: number;
    totals: InventoryListTotals;
  }> {
    const conditions = this.createAssetConditions(input);
    const orderColumn = this.getSortColumn(input.sortBy);
    const orderExpression =
      input.sortDirection === 'asc' ? asc(orderColumn) : desc(orderColumn);

    const [data, summary] = await Promise.all([
      db
        .select()
        .from(inventoryAssets)
        .where(and(...conditions))
        .orderBy(orderExpression)
        .limit(input.limit)
        .offset(getPaginationOffset(input)),
      db
        .select({
          total: sql<number>`count(*)::int`,
          stockQuantity: sql<number>`coalesce(sum(${inventoryAssets.stockQuantity}), 0)::int`,
          purchaseValue: sql<string>`coalesce(sum(${inventoryAssets.purchasePrice} * ${inventoryAssets.stockQuantity}), 0)::numeric`,
          mrpValue: sql<string>`coalesce(sum(${inventoryAssets.mrpPrice} * ${inventoryAssets.stockQuantity}), 0)::numeric`,
        })
        .from(inventoryAssets)
        .where(and(...conditions)),
    ]);

    const totals = summary[0];
    return {
      data,
      total: totals?.total ?? 0,
      totals: {
        stockQuantity: totals?.stockQuantity ?? 0,
        purchaseValue: Number(totals?.purchaseValue ?? 0),
        mrpValue: Number(totals?.mrpValue ?? 0),
      },
    };
  }

  async listAll(
    tenantId: string,
    filters: Pick<ListInventoryAssetsInput, 'search' | 'status' | 'vendor'>,
  ): Promise<InventoryAsset[]> {
    return db
      .select()
      .from(inventoryAssets)
      .where(
        and(
          ...this.createAssetConditions({
            tenantId,
            ...filters,
          }),
        ),
      )
      .orderBy(desc(inventoryAssets.createdAt));
  }

  async dashboard(tenantId: string): Promise<InventoryDashboardData> {
    const activeCondition = and(
      eq(inventoryAssets.tenantId, tenantId),
      isNull(inventoryAssets.deletedAt),
    );
    const [summaryRows, vendorRows] = await Promise.all([
      db
        .select({
          total: sql<number>`count(*)::int`,
          stock: sql<number>`coalesce(sum(${inventoryAssets.stockQuantity}), 0)::int`,
          sold: sql<number>`coalesce(sum(${inventoryAssets.soldQuantity}), 0)::int`,
          damaged: sql<number>`coalesce(sum(${inventoryAssets.damagedQuantity}), 0)::int`,
          investment: sql<string>`coalesce(sum(${inventoryAssets.purchasePrice} * ${inventoryAssets.stockQuantity}), 0)::numeric`,
          marketValue: sql<string>`coalesce(sum(${inventoryAssets.mrpPrice} * ${inventoryAssets.stockQuantity}), 0)::numeric`,
        })
        .from(inventoryAssets)
        .where(activeCondition),
      db
        .select({
          vendor: sql<string>`coalesce(nullif(trim(${inventoryAssets.vendor}), ''), 'Unspecified')`,
          total: sql<number>`count(*)::int`,
          stock: sql<number>`coalesce(sum(${inventoryAssets.stockQuantity}), 0)::int`,
          sold: sql<number>`coalesce(sum(${inventoryAssets.soldQuantity}), 0)::int`,
          damaged: sql<number>`coalesce(sum(${inventoryAssets.damagedQuantity}), 0)::int`,
        })
        .from(inventoryAssets)
        .where(activeCondition)
        .groupBy(
          sql`coalesce(nullif(trim(${inventoryAssets.vendor}), ''), 'Unspecified')`,
        )
        .orderBy(desc(sql`count(*)`)),
    ]);

    const summary = summaryRows[0];
    return {
      total: summary?.total ?? 0,
      stock: summary?.stock ?? 0,
      sold: summary?.sold ?? 0,
      damaged: summary?.damaged ?? 0,
      investment: Number(summary?.investment ?? 0),
      marketValue: Number(summary?.marketValue ?? 0),
      vendors: vendorRows,
    };
  }

  async findById(
    tenantId: string,
    assetId: string,
  ): Promise<InventoryAsset | undefined> {
    const [asset] = await db
      .select()
      .from(inventoryAssets)
      .where(
        and(
          eq(inventoryAssets.id, assetId),
          eq(inventoryAssets.tenantId, tenantId),
          isNull(inventoryAssets.deletedAt),
        ),
      )
      .limit(1);
    return asset;
  }

  async findBySerial(
    tenantId: string,
    serialNumber: string,
    excludingId?: string,
  ): Promise<InventoryAsset | undefined> {
    const conditions: SQL[] = [
      eq(inventoryAssets.tenantId, tenantId),
      isNull(inventoryAssets.deletedAt),
      sql`lower(${inventoryAssets.serialNumber}) = lower(${serialNumber})`,
    ];
    if (excludingId)
      conditions.push(sql`${inventoryAssets.id} <> ${excludingId}`);
    const [asset] = await db
      .select()
      .from(inventoryAssets)
      .where(and(...conditions))
      .limit(1);
    return asset;
  }

  async create(values: NewInventoryAsset): Promise<InventoryAsset> {
    const [asset] = await db.insert(inventoryAssets).values(values).returning();
    if (!asset) throw new Error('Database did not return the created asset');
    return asset;
  }

  async update(
    tenantId: string,
    assetId: string,
    values: Partial<NewInventoryAsset>,
  ): Promise<InventoryAsset | undefined> {
    const [asset] = await db
      .update(inventoryAssets)
      .set(values)
      .where(
        and(
          eq(inventoryAssets.id, assetId),
          eq(inventoryAssets.tenantId, tenantId),
          isNull(inventoryAssets.deletedAt),
        ),
      )
      .returning();
    return asset;
  }

  async archive(
    tenantId: string,
    assetId: string,
    actorUserId: string,
  ): Promise<InventoryAsset | undefined> {
    return this.update(tenantId, assetId, {
      deletedAt: new Date(),
      updatedAt: new Date(),
      updatedBy: actorUserId,
    });
  }

  async addMovement(input: {
    tenantId: string;
    assetId: string;
    type: InventoryMovementType;
    quantityDelta: number;
    stockQuantityAfter: number;
    remarks?: string;
    actorUserId: string;
  }): Promise<void> {
    await db.insert(inventoryMovements).values({
      tenantId: input.tenantId,
      assetId: input.assetId,
      type: input.type,
      quantityDelta: input.quantityDelta,
      stockQuantityAfter: input.stockQuantityAfter,
      remarks: input.remarks,
      performedBy: input.actorUserId,
    });
  }

  async listMovements(input: {
    tenantId: string;
    search?: string;
    type?: InventoryMovementType;
    page: number;
    limit: number;
  }): Promise<{ data: InventoryMovementListRow[]; total: number }> {
    const conditions: SQL[] = [eq(inventoryMovements.tenantId, input.tenantId)];
    if (input.type) conditions.push(eq(inventoryMovements.type, input.type));
    if (input.search?.trim()) {
      const pattern = `%${input.search.trim()}%`;
      const search = or(
        ilike(inventoryAssets.itemName, pattern),
        ilike(inventoryAssets.serialNumber, pattern),
        ilike(users.firstName, pattern),
        ilike(users.lastName, pattern),
      );
      if (search) conditions.push(search);
    }

    const [data, countRows] = await Promise.all([
      db
        .select({
          id: inventoryMovements.id,
          assetId: inventoryMovements.assetId,
          itemName: inventoryAssets.itemName,
          serialNumber: inventoryAssets.serialNumber,
          type: inventoryMovements.type,
          quantityDelta: inventoryMovements.quantityDelta,
          stockQuantityAfter: inventoryMovements.stockQuantityAfter,
          remarks: inventoryMovements.remarks,
          performedBy: inventoryMovements.performedBy,
          performerName: sql<
            string | null
          >`nullif(concat_ws(' ', ${users.firstName}, ${users.lastName}), '')`,
          createdAt: inventoryMovements.createdAt,
        })
        .from(inventoryMovements)
        .innerJoin(
          inventoryAssets,
          eq(inventoryAssets.id, inventoryMovements.assetId),
        )
        .leftJoin(users, eq(users.id, inventoryMovements.performedBy))
        .where(and(...conditions))
        .orderBy(desc(inventoryMovements.createdAt))
        .limit(input.limit)
        .offset(getPaginationOffset(input)),
      db
        .select({ total: sql<number>`count(*)::int` })
        .from(inventoryMovements)
        .innerJoin(
          inventoryAssets,
          eq(inventoryAssets.id, inventoryMovements.assetId),
        )
        .leftJoin(users, eq(users.id, inventoryMovements.performedBy))
        .where(and(...conditions)),
    ]);
    return { data, total: countRows[0]?.total ?? 0 };
  }

  private createAssetConditions(
    input: Pick<
      ListInventoryAssetsInput,
      'tenantId' | 'search' | 'status' | 'vendor'
    >,
  ): SQL[] {
    const conditions: SQL[] = [
      eq(inventoryAssets.tenantId, input.tenantId),
      isNull(inventoryAssets.deletedAt),
    ];
    if (input.status) conditions.push(eq(inventoryAssets.status, input.status));
    if (input.vendor?.trim()) {
      conditions.push(ilike(inventoryAssets.vendor, input.vendor.trim()));
    }
    if (input.search?.trim()) {
      const pattern = `%${input.search.trim()}%`;
      const search = or(
        ilike(inventoryAssets.itemName, pattern),
        ilike(inventoryAssets.category, pattern),
        ilike(inventoryAssets.vendor, pattern),
        ilike(inventoryAssets.modelNumber, pattern),
        ilike(inventoryAssets.serialNumber, pattern),
        ilike(inventoryAssets.purchaseSource, pattern),
      );
      if (search) conditions.push(search);
    }
    return conditions;
  }

  private getSortColumn(sortBy: InventorySortField) {
    switch (sortBy) {
      case 'itemName':
        return inventoryAssets.itemName;
      case 'category':
        return inventoryAssets.category;
      case 'serialNumber':
        return inventoryAssets.serialNumber;
      case 'purchasePrice':
        return inventoryAssets.purchasePrice;
      case 'mrpPrice':
        return inventoryAssets.mrpPrice;
      case 'stockQuantity':
        return inventoryAssets.stockQuantity;
      case 'status':
        return inventoryAssets.status;
      case 'createdAt':
      default:
        return inventoryAssets.createdAt;
    }
  }
}
