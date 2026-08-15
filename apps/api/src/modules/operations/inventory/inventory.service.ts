import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { InventoryAsset, NewInventoryAsset } from '@erp/db';

import { createPaginatedResult } from '../../../common/pagination';
import { CreateInventoryAssetDto } from './dto/create-inventory-asset.dto';
import { InventoryAssetResponseDto } from './dto/inventory-response.dto';
import { ListInventoryAssetsQueryDto } from './dto/list-inventory-assets-query.dto';
import { ListInventoryMovementsQueryDto } from './dto/list-inventory-movements-query.dto';
import { UpdateInventoryAssetDto } from './dto/update-inventory-asset.dto';
import { INVENTORY_SAMPLE_CSV, parseInventoryCsv } from './inventory-csv';
import { InventoryRepository } from './inventory.repository';

@Injectable()
export class InventoryService {
  constructor(private readonly inventoryRepository: InventoryRepository) {}

  async list(tenantId: string, query: ListInventoryAssetsQueryDto) {
    const result = await this.inventoryRepository.list({
      tenantId,
      search: query.search,
      status: query.status,
      vendor: query.vendor,
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortDirection: query.sortDirection,
    });
    return {
      ...createPaginatedResult(
        result.data.map(InventoryAssetResponseDto.fromEntity),
        query.page,
        query.limit,
        result.total,
      ),
      totals: result.totals,
    };
  }

  dashboard(tenantId: string) {
    return this.inventoryRepository.dashboard(tenantId);
  }

  async findById(tenantId: string, assetId: string) {
    const asset = await this.requireAsset(tenantId, assetId);
    return InventoryAssetResponseDto.fromEntity(asset);
  }

  async create(
    tenantId: string,
    actorUserId: string,
    dto: CreateInventoryAssetDto,
  ) {
    const asset = await this.createOne(
      tenantId,
      actorUserId,
      dto,
      'Manual entry',
    );
    return InventoryAssetResponseDto.fromEntity(asset);
  }

  async update(
    tenantId: string,
    assetId: string,
    actorUserId: string,
    dto: UpdateInventoryAssetDto,
  ) {
    const existing = await this.requireAsset(tenantId, assetId);
    const serialNumber = this.optional(dto.serialNumber);
    if (
      serialNumber &&
      serialNumber.toLowerCase() !== existing.serialNumber?.toLowerCase()
    ) {
      await this.assertSerialAvailable(tenantId, serialNumber, assetId);
    }

    const values: Partial<NewInventoryAsset> = {
      updatedAt: new Date(),
      updatedBy: actorUserId,
    };
    this.assignText(values, 'itemName', dto.itemName);
    this.assignText(values, 'category', dto.category);
    this.assignNullableText(values, 'vendor', dto.vendor);
    this.assignNullableText(values, 'modelNumber', dto.modelNumber);
    this.assignNullableText(values, 'serialNumber', dto.serialNumber);
    this.assignNullableText(values, 'purchaseSource', dto.purchaseSource);
    this.assignNullableText(values, 'location', dto.location);
    this.assignNullableText(values, 'notes', dto.notes);
    this.assignNullableText(values, 'assignedUserName', dto.assignedUserName);
    this.assignNullableText(
      values,
      'assignedUserContact',
      dto.assignedUserContact,
    );
    this.assignNullableText(values, 'purpose', dto.purpose);
    if (dto.purchaseDate !== undefined) {
      values.purchaseDate = dto.purchaseDate || null;
    }
    if (dto.assignedDate !== undefined) {
      values.assignedDate = dto.assignedDate || null;
    }
    if (dto.quantity !== undefined) values.stockQuantity = dto.quantity;
    if (dto.soldQuantity !== undefined) values.soldQuantity = dto.soldQuantity;
    if (dto.damagedQuantity !== undefined) {
      values.damagedQuantity = dto.damagedQuantity;
    }
    if (dto.purchasePrice !== undefined) {
      values.purchasePrice = dto.purchasePrice.toFixed(2);
    }
    if (dto.mrpPrice !== undefined) values.mrpPrice = dto.mrpPrice.toFixed(2);
    if (dto.status !== undefined) values.status = dto.status;

    try {
      const updated = await this.inventoryRepository.update(
        tenantId,
        assetId,
        values,
      );
      if (!updated) throw new NotFoundException('Inventory asset not found');

      const quantityDelta = updated.stockQuantity - existing.stockQuantity;
      await this.inventoryRepository.addMovement({
        tenantId,
        assetId,
        type: 'ADJUSTMENT',
        quantityDelta,
        stockQuantityAfter: updated.stockQuantity,
        remarks: 'Asset details updated',
        actorUserId,
      });
      return InventoryAssetResponseDto.fromEntity(updated);
    } catch (error: unknown) {
      this.rethrowSerialConflict(error);
      throw error;
    }
  }

  async archive(
    tenantId: string,
    assetId: string,
    actorUserId: string,
  ): Promise<void> {
    const existing = await this.requireAsset(tenantId, assetId);
    await this.inventoryRepository.addMovement({
      tenantId,
      assetId,
      type: 'REMOVAL',
      quantityDelta: -existing.stockQuantity,
      stockQuantityAfter: 0,
      remarks: 'Asset archived',
      actorUserId,
    });
    await this.inventoryRepository.archive(tenantId, assetId, actorUserId);
  }

  async importCsv(
    tenantId: string,
    actorUserId: string,
    file: Express.Multer.File | undefined,
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Select a CSV file to import');
    }
    if (!file.originalname.toLowerCase().endsWith('.csv')) {
      throw new BadRequestException('Only CSV files can be imported');
    }

    const rows = parseInventoryCsv(file.buffer);
    const imported: InventoryAssetResponseDto[] = [];
    for (const row of rows) {
      const asset = await this.createOne(
        tenantId,
        actorUserId,
        row,
        `Imported from ${file.originalname}`,
      );
      imported.push(InventoryAssetResponseDto.fromEntity(asset));
    }
    return { imported: imported.length, assets: imported };
  }

  sampleCsv() {
    return {
      fileName: 'inventory-import-template.csv',
      content: INVENTORY_SAMPLE_CSV,
    };
  }

  async exportCsv(tenantId: string, query: ListInventoryAssetsQueryDto) {
    const rows = await this.inventoryRepository.listAll(tenantId, {
      search: query.search,
      status: query.status,
      vendor: query.vendor,
    });
    const headers = [
      'item_name',
      'category',
      'vendor',
      'model_no',
      'serial_no',
      'purchase_source',
      'stock_quantity',
      'sold_quantity',
      'damaged_quantity',
      'cost',
      'mrp',
      'status',
      'notes',
    ];
    const content = [
      headers.join(','),
      ...rows.map((row) =>
        [
          row.itemName,
          row.category,
          row.vendor,
          row.modelNumber,
          row.serialNumber,
          row.purchaseSource,
          row.stockQuantity,
          row.soldQuantity,
          row.damagedQuantity,
          row.purchasePrice,
          row.mrpPrice,
          row.status,
          row.notes,
        ]
          .map(this.csvCell)
          .join(','),
      ),
    ].join('\r\n');
    return {
      fileName: `inventory-${new Date().toISOString().slice(0, 10)}.csv`,
      content,
    };
  }

  async listMovements(tenantId: string, query: ListInventoryMovementsQueryDto) {
    const result = await this.inventoryRepository.listMovements({
      tenantId,
      search: query.search,
      type: query.type,
      page: query.page,
      limit: query.limit,
    });
    return createPaginatedResult(
      result.data,
      query.page,
      query.limit,
      result.total,
    );
  }

  private async createOne(
    tenantId: string,
    actorUserId: string,
    dto: CreateInventoryAssetDto,
    remarks: string,
  ): Promise<InventoryAsset> {
    const serialNumber = this.optional(dto.serialNumber);
    if (serialNumber) await this.assertSerialAvailable(tenantId, serialNumber);

    const quantities = this.initialQuantities(dto.status, dto.quantity);
    try {
      const asset = await this.inventoryRepository.create({
        tenantId,
        itemName: dto.itemName.trim(),
        category: dto.category.trim(),
        vendor: this.optional(dto.vendor),
        modelNumber: this.optional(dto.modelNumber),
        serialNumber,
        purchaseSource: this.optional(dto.purchaseSource),
        purchaseDate: dto.purchaseDate || null,
        location: this.optional(dto.location),
        ...quantities,
        purchasePrice: dto.purchasePrice.toFixed(2),
        mrpPrice: dto.mrpPrice.toFixed(2),
        status: dto.status,
        notes: this.optional(dto.notes),
        assignedUserName: this.optional(dto.assignedUserName),
        assignedUserContact: this.optional(dto.assignedUserContact),
        assignedDate: dto.assignedDate || null,
        purpose: this.optional(dto.purpose),
        createdBy: actorUserId,
        updatedBy: actorUserId,
      });
      await this.inventoryRepository.addMovement({
        tenantId,
        assetId: asset.id,
        type: dto.status === 'DAMAGED' ? 'DAMAGE' : 'ADDITION',
        quantityDelta: asset.stockQuantity,
        stockQuantityAfter: asset.stockQuantity,
        remarks,
        actorUserId,
      });
      return asset;
    } catch (error: unknown) {
      this.rethrowSerialConflict(error);
      throw error;
    }
  }

  private initialQuantities(
    status: CreateInventoryAssetDto['status'],
    quantity: number,
  ) {
    if (status === 'SOLD' || status === 'DELIVERED') {
      return { stockQuantity: 0, soldQuantity: quantity, damagedQuantity: 0 };
    }
    if (status === 'DAMAGED') {
      return { stockQuantity: 0, soldQuantity: 0, damagedQuantity: quantity };
    }
    if (status === 'OUT_OF_STOCK') {
      return { stockQuantity: 0, soldQuantity: 0, damagedQuantity: 0 };
    }
    return { stockQuantity: quantity, soldQuantity: 0, damagedQuantity: 0 };
  }

  private async requireAsset(tenantId: string, assetId: string) {
    const asset = await this.inventoryRepository.findById(tenantId, assetId);
    if (!asset) throw new NotFoundException('Inventory asset not found');
    return asset;
  }

  private async assertSerialAvailable(
    tenantId: string,
    serialNumber: string,
    excludingId?: string,
  ): Promise<void> {
    if (
      await this.inventoryRepository.findBySerial(
        tenantId,
        serialNumber,
        excludingId,
      )
    ) {
      throw new ConflictException(
        'An asset with this serial number already exists',
      );
    }
  }

  private optional(value: string | undefined): string | undefined {
    const normalized = value?.trim();
    return normalized ? normalized : undefined;
  }

  private assignText(
    values: Partial<NewInventoryAsset>,
    key: 'itemName' | 'category',
    value: string | undefined,
  ): void {
    if (value !== undefined) values[key] = value.trim();
  }

  private assignNullableText(
    values: Partial<NewInventoryAsset>,
    key:
      | 'vendor'
      | 'modelNumber'
      | 'serialNumber'
      | 'purchaseSource'
      | 'location'
      | 'notes'
      | 'assignedUserName'
      | 'assignedUserContact'
      | 'purpose',
    value: string | undefined,
  ): void {
    if (value !== undefined) values[key] = this.optional(value) ?? null;
  }

  private csvCell(value: unknown): string {
    const text = value === null || value === undefined ? '' : String(value);
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }

  private rethrowSerialConflict(error: unknown): void {
    if (this.databaseErrorCode(error) === '23505') {
      throw new ConflictException(
        'An asset with this serial number already exists',
      );
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
