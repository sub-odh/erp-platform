import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

import { CreateInventoryAssetDto } from './create-inventory-asset.dto';

export class UpdateInventoryAssetDto extends PartialType(
  CreateInventoryAssetDto,
) {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  soldQuantity?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  damagedQuantity?: number;
}
