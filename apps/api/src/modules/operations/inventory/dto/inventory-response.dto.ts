import type { InventoryAsset } from '@erp/db';

export class InventoryAssetResponseDto {
  id!: string;
  tenantId!: string;
  itemName!: string;
  category!: string;
  vendor!: string | null;
  modelNumber!: string | null;
  serialNumber!: string | null;
  purchaseSource!: string | null;
  purchaseDate!: string | null;
  location!: string | null;
  stockQuantity!: number;
  soldQuantity!: number;
  damagedQuantity!: number;
  purchasePrice!: number;
  mrpPrice!: number;
  status!: string;
  notes!: string | null;
  assignedUserName!: string | null;
  assignedUserContact!: string | null;
  assignedDate!: string | null;
  purpose!: string | null;
  createdAt!: Date;
  updatedAt!: Date;

  static fromEntity(entity: InventoryAsset): InventoryAssetResponseDto {
    return {
      id: entity.id,
      tenantId: entity.tenantId,
      itemName: entity.itemName,
      category: entity.category,
      vendor: entity.vendor,
      modelNumber: entity.modelNumber,
      serialNumber: entity.serialNumber,
      purchaseSource: entity.purchaseSource,
      purchaseDate: entity.purchaseDate,
      location: entity.location,
      stockQuantity: entity.stockQuantity,
      soldQuantity: entity.soldQuantity,
      damagedQuantity: entity.damagedQuantity,
      purchasePrice: Number(entity.purchasePrice),
      mrpPrice: Number(entity.mrpPrice),
      status: entity.status,
      notes: entity.notes,
      assignedUserName: entity.assignedUserName,
      assignedUserContact: entity.assignedUserContact,
      assignedDate: entity.assignedDate,
      purpose: entity.purpose,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
