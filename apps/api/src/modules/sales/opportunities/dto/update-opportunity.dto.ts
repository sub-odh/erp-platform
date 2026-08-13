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

function trimOptional({ value }: { value: unknown }): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  return value.trim();
}

export class UpdateOpportunityDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @Transform(trimOptional)
  name?: string;

  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @IsUUID()
  leadId?: string;

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
