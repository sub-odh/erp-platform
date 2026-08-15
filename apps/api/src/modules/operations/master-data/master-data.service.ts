import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type {
  NewOperationsCategory,
  NewOperationsProduct,
  NewOperationsUnit,
  NewOperationsVendor,
  OperationsCategory,
  OperationsUnit,
  OperationsVendor,
} from '@erp/db';

import { createPaginatedResult } from '../../../common/pagination';
import {
  CreateCategoryDto,
  CreateProductDto,
  CreateUnitDto,
  CreateVendorDto,
  ListMasterDataQueryDto,
  UpdateCategoryDto,
  UpdateProductDto,
  UpdateUnitDto,
  UpdateVendorDto,
} from './dto/master-data.dto';
import { MasterDataRepository } from './master-data.repository';

@Injectable()
export class MasterDataService {
  constructor(private readonly repository: MasterDataRepository) {}

  async listCategories(tenantId: string, query: ListMasterDataQueryDto) {
    const result = await this.repository.listCategories({ tenantId, ...query });
    return createPaginatedResult(
      result.data,
      query.page,
      query.limit,
      result.total,
    );
  }

  async listUnits(tenantId: string, query: ListMasterDataQueryDto) {
    const result = await this.repository.listUnits({ tenantId, ...query });
    return createPaginatedResult(
      result.data,
      query.page,
      query.limit,
      result.total,
    );
  }

  async listVendors(tenantId: string, query: ListMasterDataQueryDto) {
    const result = await this.repository.listVendors({ tenantId, ...query });
    return createPaginatedResult(
      result.data,
      query.page,
      query.limit,
      result.total,
    );
  }

  async listProducts(tenantId: string, query: ListMasterDataQueryDto) {
    const result = await this.repository.listProducts({ tenantId, ...query });
    return createPaginatedResult(
      result.data.map((product) => ({
        ...product,
        purchasePrice: Number(product.purchasePrice),
        sellingPrice: Number(product.sellingPrice),
      })),
      query.page,
      query.limit,
      result.total,
    );
  }

  options(tenantId: string) {
    return this.repository.options(tenantId);
  }

  async createCategory(
    tenantId: string,
    actorUserId: string,
    dto: CreateCategoryDto,
  ) {
    return this.withDuplicateMessage(
      'Category code or name already exists',
      () =>
        this.repository.createCategory({
          tenantId,
          code: dto.code.trim().toUpperCase(),
          name: dto.name.trim(),
          isActive: dto.isActive,
          createdBy: actorUserId,
          updatedBy: actorUserId,
        }),
    );
  }

  async updateCategory(
    tenantId: string,
    id: string,
    actorUserId: string,
    dto: UpdateCategoryDto,
  ) {
    await this.requireCategory(tenantId, id);
    const values: Partial<NewOperationsCategory> = {
      updatedAt: new Date(),
      updatedBy: actorUserId,
    };
    if (dto.code !== undefined) values.code = dto.code.trim().toUpperCase();
    if (dto.name !== undefined) values.name = dto.name.trim();
    if (dto.isActive !== undefined) values.isActive = dto.isActive;
    return this.withDuplicateMessage(
      'Category code or name already exists',
      () => this.repository.updateCategory(tenantId, id, values),
    );
  }

  async archiveCategory(tenantId: string, id: string, actorUserId: string) {
    await this.requireCategory(tenantId, id);
    await this.repository.archiveCategory(tenantId, id, actorUserId);
  }

  async createUnit(tenantId: string, actorUserId: string, dto: CreateUnitDto) {
    return this.withDuplicateMessage('Unit name or symbol already exists', () =>
      this.repository.createUnit({
        tenantId,
        name: dto.name.trim(),
        symbol: dto.symbol.trim(),
        isActive: dto.isActive,
        createdBy: actorUserId,
        updatedBy: actorUserId,
      }),
    );
  }

  async updateUnit(
    tenantId: string,
    id: string,
    actorUserId: string,
    dto: UpdateUnitDto,
  ) {
    await this.requireUnit(tenantId, id);
    const values: Partial<NewOperationsUnit> = {
      updatedAt: new Date(),
      updatedBy: actorUserId,
    };
    if (dto.name !== undefined) values.name = dto.name.trim();
    if (dto.symbol !== undefined) values.symbol = dto.symbol.trim();
    if (dto.isActive !== undefined) values.isActive = dto.isActive;
    return this.withDuplicateMessage('Unit name or symbol already exists', () =>
      this.repository.updateUnit(tenantId, id, values),
    );
  }

  async archiveUnit(tenantId: string, id: string, actorUserId: string) {
    await this.requireUnit(tenantId, id);
    await this.repository.archiveUnit(tenantId, id, actorUserId);
  }

  async createVendor(
    tenantId: string,
    actorUserId: string,
    dto: CreateVendorDto,
  ) {
    return this.withDuplicateMessage('Vendor code already exists', () =>
      this.repository.createVendor({
        tenantId,
        code: dto.code.trim().toUpperCase(),
        name: dto.name.trim(),
        contactPerson: this.optional(dto.contactPerson),
        email: this.optional(dto.email)?.toLowerCase(),
        phone: this.optional(dto.phone),
        taxNumber: this.optional(dto.taxNumber),
        address: this.optional(dto.address),
        paymentTermsDays: dto.paymentTermsDays,
        notes: this.optional(dto.notes),
        isActive: dto.isActive,
        createdBy: actorUserId,
        updatedBy: actorUserId,
      }),
    );
  }

  async updateVendor(
    tenantId: string,
    id: string,
    actorUserId: string,
    dto: UpdateVendorDto,
  ) {
    await this.requireVendor(tenantId, id);
    const values: Partial<NewOperationsVendor> = {
      updatedAt: new Date(),
      updatedBy: actorUserId,
    };
    if (dto.code !== undefined) values.code = dto.code.trim().toUpperCase();
    if (dto.name !== undefined) values.name = dto.name.trim();
    this.assignNullable(values, 'contactPerson', dto.contactPerson);
    if (dto.email !== undefined) {
      values.email = this.optional(dto.email)?.toLowerCase() ?? null;
    }
    this.assignNullable(values, 'phone', dto.phone);
    this.assignNullable(values, 'taxNumber', dto.taxNumber);
    this.assignNullable(values, 'address', dto.address);
    this.assignNullable(values, 'notes', dto.notes);
    if (dto.paymentTermsDays !== undefined) {
      values.paymentTermsDays = dto.paymentTermsDays;
    }
    if (dto.isActive !== undefined) values.isActive = dto.isActive;
    return this.withDuplicateMessage('Vendor code already exists', () =>
      this.repository.updateVendor(tenantId, id, values),
    );
  }

  async archiveVendor(tenantId: string, id: string, actorUserId: string) {
    await this.requireVendor(tenantId, id);
    await this.repository.archiveVendor(tenantId, id, actorUserId);
  }

  async createProduct(
    tenantId: string,
    actorUserId: string,
    dto: CreateProductDto,
  ) {
    await this.validateProductReferences(tenantId, dto);
    const product = await this.withDuplicateMessage(
      'Product SKU already exists',
      () =>
        this.repository.createProduct({
          tenantId,
          sku: dto.sku.trim().toUpperCase(),
          name: dto.name.trim(),
          categoryId: dto.categoryId,
          unitId: dto.unitId,
          defaultVendorId: dto.defaultVendorId,
          description: this.optional(dto.description),
          purchasePrice: dto.purchasePrice.toFixed(2),
          sellingPrice: dto.sellingPrice.toFixed(2),
          reorderLevel: dto.reorderLevel,
          isActive: dto.isActive,
          createdBy: actorUserId,
          updatedBy: actorUserId,
        }),
    );
    return this.productResponse(product);
  }

  async updateProduct(
    tenantId: string,
    id: string,
    actorUserId: string,
    dto: UpdateProductDto,
  ) {
    await this.requireProduct(tenantId, id);
    await this.validateProductReferences(tenantId, dto);
    const values: Partial<NewOperationsProduct> = {
      updatedAt: new Date(),
      updatedBy: actorUserId,
    };
    if (dto.sku !== undefined) values.sku = dto.sku.trim().toUpperCase();
    if (dto.name !== undefined) values.name = dto.name.trim();
    if (dto.categoryId !== undefined) values.categoryId = dto.categoryId;
    if (dto.unitId !== undefined) values.unitId = dto.unitId;
    if (dto.defaultVendorId !== undefined) {
      values.defaultVendorId = dto.defaultVendorId || null;
    }
    if (dto.description !== undefined) {
      values.description = this.optional(dto.description) ?? null;
    }
    if (dto.purchasePrice !== undefined) {
      values.purchasePrice = dto.purchasePrice.toFixed(2);
    }
    if (dto.sellingPrice !== undefined) {
      values.sellingPrice = dto.sellingPrice.toFixed(2);
    }
    if (dto.reorderLevel !== undefined) values.reorderLevel = dto.reorderLevel;
    if (dto.isActive !== undefined) values.isActive = dto.isActive;
    const product = await this.withDuplicateMessage(
      'Product SKU already exists',
      () => this.repository.updateProduct(tenantId, id, values),
    );
    if (!product) throw new NotFoundException('Product not found');
    return this.productResponse(product);
  }

  async archiveProduct(tenantId: string, id: string, actorUserId: string) {
    await this.requireProduct(tenantId, id);
    await this.repository.archiveProduct(tenantId, id, actorUserId);
  }

  private async validateProductReferences(
    tenantId: string,
    dto: UpdateProductDto | CreateProductDto,
  ) {
    if (dto.categoryId !== undefined) {
      const category = await this.requireCategory(tenantId, dto.categoryId);
      this.assertActive(category, 'Category');
    }
    if (dto.unitId !== undefined) {
      const unit = await this.requireUnit(tenantId, dto.unitId);
      this.assertActive(unit, 'Unit');
    }
    if (dto.defaultVendorId) {
      const vendor = await this.requireVendor(tenantId, dto.defaultVendorId);
      this.assertActive(vendor, 'Vendor');
    }
  }

  private assertActive(
    entity: OperationsCategory | OperationsUnit | OperationsVendor,
    label: string,
  ) {
    if (!entity.isActive) {
      throw new ConflictException(`${label} is inactive`);
    }
  }

  private async requireCategory(tenantId: string, id: string) {
    const entity = await this.repository.findCategory(tenantId, id);
    if (!entity) throw new NotFoundException('Category not found');
    return entity as OperationsCategory;
  }

  private async requireUnit(tenantId: string, id: string) {
    const entity = await this.repository.findUnit(tenantId, id);
    if (!entity) throw new NotFoundException('Unit not found');
    return entity as OperationsUnit;
  }

  private async requireVendor(tenantId: string, id: string) {
    const entity = await this.repository.findVendor(tenantId, id);
    if (!entity) throw new NotFoundException('Vendor not found');
    return entity as OperationsVendor;
  }

  private async requireProduct(tenantId: string, id: string) {
    const entity = await this.repository.findProduct(tenantId, id);
    if (!entity) throw new NotFoundException('Product not found');
    return entity;
  }

  private productResponse<
    T extends { purchasePrice: string; sellingPrice: string },
  >(product: T) {
    return {
      ...product,
      purchasePrice: Number(product.purchasePrice),
      sellingPrice: Number(product.sellingPrice),
    };
  }

  private optional(value: string | null | undefined): string | undefined {
    const normalized = value?.trim();
    return normalized || undefined;
  }

  private assignNullable(
    values: Partial<NewOperationsVendor>,
    key: 'contactPerson' | 'phone' | 'taxNumber' | 'address' | 'notes',
    value: string | null | undefined,
  ) {
    if (value !== undefined) values[key] = this.optional(value) ?? null;
  }

  private async withDuplicateMessage<T>(
    message: string,
    operation: () => Promise<T>,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error: unknown) {
      if (this.databaseErrorCode(error) === '23505') {
        throw new ConflictException(message);
      }
      throw error;
    }
  }

  private databaseErrorCode(error: unknown): string | undefined {
    if (typeof error !== 'object' || error === null) return undefined;
    const record = error as { code?: unknown; cause?: { code?: unknown } };
    if (typeof record.code === 'string') return record.code;
    return typeof record.cause?.code === 'string'
      ? record.cause.code
      : undefined;
  }
}
