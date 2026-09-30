import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class CloudQuotationItemDto {
  @IsString()
  @MaxLength(80)
  serviceType!: string;

  @IsString()
  @MaxLength(255)
  itemName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1_000_000)
  quantity!: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitPrice!: number;
}

export class SaveCloudQuotationDto {
  @IsString()
  @MaxLength(40)
  quotationNumber!: string;

  @IsDateString()
  quotationDate!: string;

  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @IsString()
  @MaxLength(255)
  customerName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  customerAddress?: string;

  @IsIn(['NPR', 'USD'])
  currency!: 'NPR' | 'USD';

  @IsOptional()
  @IsBoolean()
  vatApplicable?: boolean;

  @IsOptional()
  @IsIn(['amount', 'percent'])
  discountType?: 'amount' | 'percent';

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  discountValue?: number;

  @IsOptional()
  @IsString()
  @MaxLength(8000)
  termsConditions?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CloudQuotationItemDto)
  items!: CloudQuotationItemDto[];
}
