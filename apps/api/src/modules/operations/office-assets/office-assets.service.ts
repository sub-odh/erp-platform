import { Injectable, NotFoundException } from '@nestjs/common';

import type { OfficeAsset } from '@erp/db';

import { SaveOfficeAssetDto } from './dto/save-office-asset.dto';
import { OfficeAssetsRepository } from './office-assets.repository';

export interface OfficeAssetView {
  id: string;
  assetName: string;
  category: string | null;
  purchaseSource: string | null;
  purchasePrice: number;
  purchaseDate: string | null;
  itemDetails: string | null;
  currentLocation: string | null;
  utilizationStatus: string;
  techPersonName: string | null;
  techPersonContact: string | null;
  techPersonEmail: string | null;
  techUsageDetails: string | null;
  techUsedDate: string | null;
  pocPersonContact: string | null;
  pocPersonEmail: string | null;
  pocCompanyName: string | null;
  pocClientName: string | null;
  pocStartDate: string | null;
  pocTakenTime: string | null;
  returnDeadline: string | null;
  returnTime: string | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class OfficeAssetsService {
  constructor(private readonly repository: OfficeAssetsRepository) {}

  async list(tenantId: string): Promise<OfficeAssetView[]> {
    const rows = await this.repository.list(tenantId);
    return rows.map((row) => this.toView(row));
  }

  async create(
    tenantId: string,
    actorUserId: string,
    dto: SaveOfficeAssetDto,
  ): Promise<OfficeAssetView> {
    const created = await this.repository.create({
      tenantId,
      assetName: dto.assetName?.trim() || 'Unnamed Asset',
      category: dto.category ?? null,
      purchaseSource: dto.purchaseSource ?? null,
      purchasePrice: (dto.purchasePrice ?? 0).toFixed(2),
      purchaseDate: dto.purchaseDate ?? null,
      itemDetails: dto.itemDetails ?? null,
      currentLocation: dto.currentLocation ?? null,
      utilizationStatus: dto.utilizationStatus ?? 'Available',
      techPersonName: dto.techPersonName ?? null,
      techPersonContact: dto.techPersonContact ?? null,
      techPersonEmail: dto.techPersonEmail ?? null,
      techUsageDetails: dto.techUsageDetails ?? null,
      techUsedDate: dto.techUsedDate ?? null,
      pocPersonContact: dto.pocPersonContact ?? null,
      pocPersonEmail: dto.pocPersonEmail ?? null,
      pocCompanyName: dto.pocCompanyName ?? null,
      pocClientName: dto.pocClientName ?? null,
      pocStartDate: dto.pocStartDate ?? null,
      pocTakenTime: dto.pocTakenTime ?? null,
      returnDeadline: dto.returnDeadline ?? null,
      returnTime: dto.returnTime ?? null,
      createdBy: actorUserId,
      updatedBy: actorUserId,
    });

    return this.toView(created);
  }

  async update(
    tenantId: string,
    actorUserId: string,
    assetId: string,
    dto: SaveOfficeAssetDto,
  ): Promise<OfficeAssetView> {
    await this.require(tenantId, assetId);

    const updated = await this.repository.update(tenantId, assetId, {
      ...(dto.assetName !== undefined
        ? { assetName: dto.assetName.trim() || 'Unnamed Asset' }
        : {}),
      ...(dto.category !== undefined ? { category: dto.category } : {}),
      ...(dto.purchaseSource !== undefined
        ? { purchaseSource: dto.purchaseSource }
        : {}),
      ...(dto.purchasePrice !== undefined
        ? { purchasePrice: dto.purchasePrice.toFixed(2) }
        : {}),
      ...(dto.purchaseDate !== undefined
        ? { purchaseDate: dto.purchaseDate }
        : {}),
      ...(dto.itemDetails !== undefined ? { itemDetails: dto.itemDetails } : {}),
      ...(dto.currentLocation !== undefined
        ? { currentLocation: dto.currentLocation }
        : {}),
      ...(dto.utilizationStatus !== undefined
        ? { utilizationStatus: dto.utilizationStatus }
        : {}),
      ...(dto.techPersonName !== undefined
        ? { techPersonName: dto.techPersonName }
        : {}),
      ...(dto.techPersonContact !== undefined
        ? { techPersonContact: dto.techPersonContact }
        : {}),
      ...(dto.techPersonEmail !== undefined
        ? { techPersonEmail: dto.techPersonEmail }
        : {}),
      ...(dto.techUsageDetails !== undefined
        ? { techUsageDetails: dto.techUsageDetails }
        : {}),
      ...(dto.techUsedDate !== undefined
        ? { techUsedDate: dto.techUsedDate }
        : {}),
      ...(dto.pocPersonContact !== undefined
        ? { pocPersonContact: dto.pocPersonContact }
        : {}),
      ...(dto.pocPersonEmail !== undefined
        ? { pocPersonEmail: dto.pocPersonEmail }
        : {}),
      ...(dto.pocCompanyName !== undefined
        ? { pocCompanyName: dto.pocCompanyName }
        : {}),
      ...(dto.pocClientName !== undefined
        ? { pocClientName: dto.pocClientName }
        : {}),
      ...(dto.pocStartDate !== undefined
        ? { pocStartDate: dto.pocStartDate }
        : {}),
      ...(dto.pocTakenTime !== undefined
        ? { pocTakenTime: dto.pocTakenTime }
        : {}),
      ...(dto.returnDeadline !== undefined
        ? { returnDeadline: dto.returnDeadline }
        : {}),
      ...(dto.returnTime !== undefined ? { returnTime: dto.returnTime } : {}),
      updatedBy: actorUserId,
    });

    if (!updated) {
      throw new NotFoundException('Asset was not found');
    }

    return this.toView(updated);
  }

  async remove(tenantId: string, assetId: string): Promise<{ message: string }> {
    const deleted = await this.repository.delete(tenantId, assetId);

    if (!deleted) {
      throw new NotFoundException('Asset was not found');
    }

    return { message: 'Asset deleted.' };
  }

  private async require(tenantId: string, assetId: string): Promise<OfficeAsset> {
    const row = await this.repository.findById(tenantId, assetId);

    if (!row) {
      throw new NotFoundException('Asset was not found');
    }

    return row;
  }

  private toView(row: OfficeAsset): OfficeAssetView {
    return {
      id: row.id,
      assetName: row.assetName,
      category: row.category,
      purchaseSource: row.purchaseSource,
      purchasePrice: Number(row.purchasePrice),
      purchaseDate: row.purchaseDate,
      itemDetails: row.itemDetails,
      currentLocation: row.currentLocation,
      utilizationStatus: row.utilizationStatus,
      techPersonName: row.techPersonName,
      techPersonContact: row.techPersonContact,
      techPersonEmail: row.techPersonEmail,
      techUsageDetails: row.techUsageDetails,
      techUsedDate: row.techUsedDate,
      pocPersonContact: row.pocPersonContact,
      pocPersonEmail: row.pocPersonEmail,
      pocCompanyName: row.pocCompanyName,
      pocClientName: row.pocClientName,
      pocStartDate: row.pocStartDate,
      pocTakenTime: row.pocTakenTime,
      returnDeadline: row.returnDeadline,
      returnTime: row.returnTime,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
