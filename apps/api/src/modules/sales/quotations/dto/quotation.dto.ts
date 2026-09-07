import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class ListQuotationsQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @IsOptional()
  @IsIn(['ACTIVE', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED'])
  status?: 'ACTIVE' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED';

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
}

export class CreateQuotationItemDto {
  @IsString()
  @MaxLength(255)
  itemName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string | null;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitPrice!: number;
}

export class CreateQuotationDto {
  @IsUUID()
  customerId!: string;

  @IsDateString()
  issueDate!: string;

  @IsDateString()
  expiryDate!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  destinationAddress?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  terms?: string | null;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateQuotationItemDto)
  items!: CreateQuotationItemDto[];
}
