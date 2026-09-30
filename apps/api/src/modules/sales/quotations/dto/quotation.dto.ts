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
  @IsIn(['active', 'expired'])
  status?: 'active' | 'expired';

  @IsOptional()
  @IsIn([
    'quotation_number',
    'quotation_date',
    'expiry_date',
    'customer_name',
    'total_amount',
    'lead',
  ])
  sort?:
    | 'quotation_number'
    | 'quotation_date'
    | 'expiry_date'
    | 'customer_name'
    | 'total_amount'
    | 'lead';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  direction?: 'asc' | 'desc';
}

export class QuotationItemDto {
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

export class SaveQuotationDto {
  @IsString()
  @MaxLength(40)
  quotationNumber!: string;

  @IsDateString()
  quotationDate!: string;

  @IsDateString()
  expiryDate!: string;

  @IsOptional()
  @IsUUID()
  leadId?: string;

  @IsOptional()
  @IsUUID()
  customerId?: string;

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
  @IsString()
  @MaxLength(8000)
  termsConditions?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => QuotationItemDto)
  items!: QuotationItemDto[];
}

export class PurgeQuotationDto {
  @IsString()
  @MaxLength(200)
  password!: string;
}
