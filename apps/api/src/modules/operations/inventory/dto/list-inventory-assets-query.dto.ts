import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { INVENTORY_ASSET_STATUSES } from './create-inventory-asset.dto';

export const INVENTORY_SORT_FIELDS = [
  'itemName',
  'category',
  'serialNumber',
  'purchasePrice',
  'mrpPrice',
  'stockQuantity',
  'status',
  'createdAt',
] as const;
export type InventorySortField = (typeof INVENTORY_SORT_FIELDS)[number];

export const INVENTORY_SORT_DIRECTIONS = ['asc', 'desc'] as const;
export type InventorySortDirection = (typeof INVENTORY_SORT_DIRECTIONS)[number];

export class ListInventoryAssetsQueryDto {
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(200)
  search?: string;

  @IsOptional()
  @IsIn(INVENTORY_ASSET_STATUSES)
  status?: (typeof INVENTORY_ASSET_STATUSES)[number];

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(200)
  vendor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  @IsOptional()
  @IsIn(INVENTORY_SORT_FIELDS)
  sortBy: InventorySortField = 'createdAt';

  @IsOptional()
  @IsIn(INVENTORY_SORT_DIRECTIONS)
  sortDirection: InventorySortDirection = 'desc';
}
