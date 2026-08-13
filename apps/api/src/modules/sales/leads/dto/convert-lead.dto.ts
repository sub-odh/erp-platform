import { Transform, Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

function trimString(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

function emptyStringToUndefined(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  const normalized = value.trim();

  return normalized.length > 0 ? normalized : undefined;
}

export class ConvertLeadDto {
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @Transform(({ value }) => emptyStringToUndefined(value))
  @IsUUID()
  customerId?: string;

  @Transform(({ value }) => emptyStringToUndefined(value))
  @IsUUID()
  stageId!: string;

  @IsOptional()
  @Transform(({ value }) => emptyStringToUndefined(value))
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
  @Transform(({ value }) => emptyStringToUndefined(value))
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'expectedCloseDate must use YYYY-MM-DD format',
  })
  expectedCloseDate?: string;

  @IsOptional()
  @Transform(({ value }) => emptyStringToUndefined(value))
  @IsString()
  @MaxLength(5000)
  description?: string;
}
