import { Transform, Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateItemReturnDto {
  @IsUUID()
  assetId!: string;

  @IsDateString()
  returnDate!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1_000_000)
  quantity!: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  customerName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class LookupItemReturnQueryDto {
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(40)
  doNumber?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(150)
  serial?: string;
}

export class ProcessItemReturnsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  lineIds!: string[];

  @IsIn(['standard', 'damaged'])
  returnType!: 'standard' | 'damaged';

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(2000)
  remarks?: string;
}
