import { Injectable } from '@nestjs/common';
import { and, desc, eq, ilike, isNull, or, sql, type SQL } from 'drizzle-orm';

import {
  db,
  operationsCategories,
  operationsProducts,
  operationsUnits,
  operationsVendors,
  type NewOperationsCategory,
  type NewOperationsProduct,
  type NewOperationsUnit,
  type NewOperationsVendor,
  type OperationsCategory,
  type OperationsProduct,
  type OperationsUnit,
  type OperationsVendor,
} from '@erp/db';

import { getPaginationOffset } from '../../../common/pagination';
import type { ListMasterDataQueryDto } from './dto/master-data.dto';

interface ListInput extends ListMasterDataQueryDto {
  tenantId: string;
}

@Injectable()
export class MasterDataRepository {
  async listCategories(input: ListInput) {
    const conditions = this.baseConditions(
      operationsCategories.tenantId,
      operationsCategories.deletedAt,
      operationsCategories.isActive,
      input,
    );
    if (input.search) {
      const search = or(
        ilike(operationsCategories.code, `%${input.search}%`),
        ilike(operationsCategories.name, `%${input.search}%`),
      );
      if (search) conditions.push(search);
    }
    return this.listTable(operationsCategories, conditions, input);
  }

  async listUnits(input: ListInput) {
    const conditions = this.baseConditions(
      operationsUnits.tenantId,
      operationsUnits.deletedAt,
      operationsUnits.isActive,
      input,
    );
    if (input.search) {
      const search = or(
        ilike(operationsUnits.name, `%${input.search}%`),
        ilike(operationsUnits.symbol, `%${input.search}%`),
      );
      if (search) conditions.push(search);
    }
    return this.listTable(operationsUnits, conditions, input);
  }

  async listVendors(input: ListInput) {
    const conditions = this.baseConditions(
      operationsVendors.tenantId,
      operationsVendors.deletedAt,
      operationsVendors.isActive,
      input,
    );
    if (input.search) {
      const pattern = `%${input.search}%`;
      const search = or(
        ilike(operationsVendors.code, pattern),
        ilike(operationsVendors.name, pattern),
        ilike(operationsVendors.contactPerson, pattern),
        ilike(operationsVendors.email, pattern),
        ilike(operationsVendors.phone, pattern),
        ilike(operationsVendors.taxNumber, pattern),
      );
      if (search) conditions.push(search);
    }
    return this.listTable(operationsVendors, conditions, input);
  }

  async listProducts(input: ListInput) {
    const conditions = this.baseConditions(
      operationsProducts.tenantId,
      operationsProducts.deletedAt,
      operationsProducts.isActive,
      input,
    );
    if (input.search) {
      const pattern = `%${input.search}%`;
      const search = or(
        ilike(operationsProducts.sku, pattern),
        ilike(operationsProducts.name, pattern),
        ilike(operationsProducts.description, pattern),
      );
      if (search) conditions.push(search);
    }

    const [data, countRows] = await Promise.all([
      db
        .select({
          id: operationsProducts.id,
          tenantId: operationsProducts.tenantId,
          sku: operationsProducts.sku,
          name: operationsProducts.name,
          categoryId: operationsProducts.categoryId,
          categoryName: operationsCategories.name,
          unitId: operationsProducts.unitId,
          unitName: operationsUnits.name,
          unitSymbol: operationsUnits.symbol,
          defaultVendorId: operationsProducts.defaultVendorId,
          defaultVendorName: operationsVendors.name,
          description: operationsProducts.description,
          purchasePrice: operationsProducts.purchasePrice,
          sellingPrice: operationsProducts.sellingPrice,
          reorderLevel: operationsProducts.reorderLevel,
          isActive: operationsProducts.isActive,
          createdAt: operationsProducts.createdAt,
          updatedAt: operationsProducts.updatedAt,
        })
        .from(operationsProducts)
        .innerJoin(
          operationsCategories,
          eq(operationsCategories.id, operationsProducts.categoryId),
        )
        .innerJoin(
          operationsUnits,
          eq(operationsUnits.id, operationsProducts.unitId),
        )
        .leftJoin(
          operationsVendors,
          eq(operationsVendors.id, operationsProducts.defaultVendorId),
        )
        .where(and(...conditions))
        .orderBy(desc(operationsProducts.createdAt))
        .limit(input.limit)
        .offset(getPaginationOffset(input)),
      db
        .select({ total: sql<number>`count(*)::int` })
        .from(operationsProducts)
        .where(and(...conditions)),
    ]);
    return { data, total: countRows[0]?.total ?? 0 };
  }

  async options(tenantId: string) {
    const [categories, units, vendors] = await Promise.all([
      db
        .select({
          id: operationsCategories.id,
          code: operationsCategories.code,
          name: operationsCategories.name,
        })
        .from(operationsCategories)
        .where(
          and(
            eq(operationsCategories.tenantId, tenantId),
            eq(operationsCategories.isActive, true),
            isNull(operationsCategories.deletedAt),
          ),
        )
        .orderBy(operationsCategories.name),
      db
        .select({
          id: operationsUnits.id,
          name: operationsUnits.name,
          symbol: operationsUnits.symbol,
        })
        .from(operationsUnits)
        .where(
          and(
            eq(operationsUnits.tenantId, tenantId),
            eq(operationsUnits.isActive, true),
            isNull(operationsUnits.deletedAt),
          ),
        )
        .orderBy(operationsUnits.name),
      db
        .select({
          id: operationsVendors.id,
          code: operationsVendors.code,
          name: operationsVendors.name,
        })
        .from(operationsVendors)
        .where(
          and(
            eq(operationsVendors.tenantId, tenantId),
            eq(operationsVendors.isActive, true),
            isNull(operationsVendors.deletedAt),
          ),
        )
        .orderBy(operationsVendors.name),
    ]);
    return { categories, units, vendors };
  }

  findCategory(
    tenantId: string,
    id: string,
  ): Promise<OperationsCategory | undefined> {
    return this.findOne(
      operationsCategories,
      operationsCategories.tenantId,
      operationsCategories.id,
      operationsCategories.deletedAt,
      tenantId,
      id,
    ) as Promise<OperationsCategory | undefined>;
  }

  findUnit(tenantId: string, id: string): Promise<OperationsUnit | undefined> {
    return this.findOne(
      operationsUnits,
      operationsUnits.tenantId,
      operationsUnits.id,
      operationsUnits.deletedAt,
      tenantId,
      id,
    ) as Promise<OperationsUnit | undefined>;
  }

  findVendor(
    tenantId: string,
    id: string,
  ): Promise<OperationsVendor | undefined> {
    return this.findOne(
      operationsVendors,
      operationsVendors.tenantId,
      operationsVendors.id,
      operationsVendors.deletedAt,
      tenantId,
      id,
    ) as Promise<OperationsVendor | undefined>;
  }

  findProduct(
    tenantId: string,
    id: string,
  ): Promise<OperationsProduct | undefined> {
    return this.findOne(
      operationsProducts,
      operationsProducts.tenantId,
      operationsProducts.id,
      operationsProducts.deletedAt,
      tenantId,
      id,
    ) as Promise<OperationsProduct | undefined>;
  }

  createCategory(values: NewOperationsCategory): Promise<OperationsCategory> {
    return this.insertOne(
      operationsCategories,
      values,
    ) as Promise<OperationsCategory>;
  }

  createUnit(values: NewOperationsUnit): Promise<OperationsUnit> {
    return this.insertOne(operationsUnits, values) as Promise<OperationsUnit>;
  }

  createVendor(values: NewOperationsVendor): Promise<OperationsVendor> {
    return this.insertOne(
      operationsVendors,
      values,
    ) as Promise<OperationsVendor>;
  }

  createProduct(values: NewOperationsProduct): Promise<OperationsProduct> {
    return this.insertOne(
      operationsProducts,
      values,
    ) as Promise<OperationsProduct>;
  }

  updateCategory(
    tenantId: string,
    id: string,
    values: Partial<NewOperationsCategory>,
  ): Promise<OperationsCategory | undefined> {
    return this.updateOne(
      operationsCategories,
      operationsCategories.tenantId,
      operationsCategories.id,
      operationsCategories.deletedAt,
      tenantId,
      id,
      values,
    ) as Promise<OperationsCategory | undefined>;
  }

  updateUnit(
    tenantId: string,
    id: string,
    values: Partial<NewOperationsUnit>,
  ): Promise<OperationsUnit | undefined> {
    return this.updateOne(
      operationsUnits,
      operationsUnits.tenantId,
      operationsUnits.id,
      operationsUnits.deletedAt,
      tenantId,
      id,
      values,
    ) as Promise<OperationsUnit | undefined>;
  }

  updateVendor(
    tenantId: string,
    id: string,
    values: Partial<NewOperationsVendor>,
  ): Promise<OperationsVendor | undefined> {
    return this.updateOne(
      operationsVendors,
      operationsVendors.tenantId,
      operationsVendors.id,
      operationsVendors.deletedAt,
      tenantId,
      id,
      values,
    ) as Promise<OperationsVendor | undefined>;
  }

  updateProduct(
    tenantId: string,
    id: string,
    values: Partial<NewOperationsProduct>,
  ): Promise<OperationsProduct | undefined> {
    return this.updateOne(
      operationsProducts,
      operationsProducts.tenantId,
      operationsProducts.id,
      operationsProducts.deletedAt,
      tenantId,
      id,
      values,
    ) as Promise<OperationsProduct | undefined>;
  }

  archiveCategory(tenantId: string, id: string, actorUserId: string) {
    return this.updateCategory(tenantId, id, this.archiveValues(actorUserId));
  }

  archiveUnit(tenantId: string, id: string, actorUserId: string) {
    return this.updateUnit(tenantId, id, this.archiveValues(actorUserId));
  }

  archiveVendor(tenantId: string, id: string, actorUserId: string) {
    return this.updateVendor(tenantId, id, this.archiveValues(actorUserId));
  }

  archiveProduct(tenantId: string, id: string, actorUserId: string) {
    return this.updateProduct(tenantId, id, this.archiveValues(actorUserId));
  }

  private baseConditions(
    tenantColumn: any,
    deletedColumn: any,
    activeColumn: any,
    input: ListInput,
  ): SQL[] {
    const conditions: SQL[] = [
      eq(tenantColumn, input.tenantId),
      isNull(deletedColumn),
    ];
    if (input.isActive !== undefined)
      conditions.push(eq(activeColumn, input.isActive));
    return conditions;
  }

  private async listTable(table: any, conditions: SQL[], input: ListInput) {
    const [data, countRows] = await Promise.all([
      db
        .select()
        .from(table)
        .where(and(...conditions))
        .orderBy(desc(table.createdAt))
        .limit(input.limit)
        .offset(getPaginationOffset(input)),
      db
        .select({ total: sql<number>`count(*)::int` })
        .from(table)
        .where(and(...conditions)),
    ]);
    return { data, total: countRows[0]?.total ?? 0 };
  }

  private async findOne(
    table: any,
    tenantColumn: any,
    idColumn: any,
    deletedColumn: any,
    tenantId: string,
    id: string,
  ) {
    const [row] = await db
      .select()
      .from(table)
      .where(
        and(
          eq(tenantColumn, tenantId),
          eq(idColumn, id),
          isNull(deletedColumn),
        ),
      )
      .limit(1);
    return row;
  }

  private async insertOne(table: any, values: any) {
    const [row] = await db.insert(table).values(values).returning();
    if (!row) throw new Error('Database did not return the created record');
    return row;
  }

  private async updateOne(
    table: any,
    tenantColumn: any,
    idColumn: any,
    deletedColumn: any,
    tenantId: string,
    id: string,
    values: any,
  ) {
    const [row] = await db
      .update(table)
      .set(values)
      .where(
        and(
          eq(tenantColumn, tenantId),
          eq(idColumn, id),
          isNull(deletedColumn),
        ),
      )
      .returning();
    return row;
  }

  private archiveValues(actorUserId: string) {
    const now = new Date();
    return {
      isActive: false,
      deletedAt: now,
      updatedAt: now,
      updatedBy: actorUserId,
    };
  }
}
