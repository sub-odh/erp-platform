import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export const OFFICE_ASSET_STATUSES = ['Available', 'In Use', 'PoC'] as const;

export type OfficeAssetStatus = (typeof OFFICE_ASSET_STATUSES)[number];

function emptyToNull(value: unknown): unknown {
  if (value === undefined || value === null) {
    return value;
  }

  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

export class SaveOfficeAssetDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @MaxLength(255)
  assetName?: string;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  @MaxLength(150)
  category?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  @MaxLength(255)
  purchaseSource?: string | null;

  @Type(() => Number)
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  purchasePrice?: number;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  purchaseDate?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  itemDetails?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  @MaxLength(255)
  currentLocation?: string | null;

  @IsOptional()
  @IsIn(OFFICE_ASSET_STATUSES)
  utilizationStatus?: OfficeAssetStatus;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  @MaxLength(255)
  techPersonName?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  @MaxLength(255)
  techPersonContact?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  @MaxLength(255)
  techPersonEmail?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  techUsageDetails?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  techUsedDate?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  @MaxLength(255)
  pocPersonContact?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  @MaxLength(255)
  pocPersonEmail?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  @MaxLength(255)
  pocCompanyName?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  @MaxLength(255)
  pocClientName?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  pocStartDate?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  @MaxLength(8)
  pocTakenTime?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  returnDeadline?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  @MaxLength(8)
  returnTime?: string | null;
}
