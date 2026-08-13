import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

function trimRequired({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

function trimOptional({ value }: { value: unknown }): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  const normalized = value.trim();

  return normalized.length > 0 ? normalized : undefined;
}

export class CreateOpportunityDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @Transform(trimRequired)
  name!: string;

  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @IsUUID()
  leadId?: string;

  @IsUUID()
  stageId!: string;

  @IsOptional()
  @IsUUID()
  ownerUserId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({
    maxDecimalPlaces: 2,
  })
  @Min(0)
  amount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  probability?: number;

  @IsOptional()
  @IsDateString()
  expectedCloseDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  @Transform(trimOptional)
  description?: string;
}
