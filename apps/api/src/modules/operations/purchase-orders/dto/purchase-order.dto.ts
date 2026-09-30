import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEmail,
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

export class ListPurchaseOrdersQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  searchVendor?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  searchPoNum?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsIn(['po_number', 'po_date', 'vendor_name', 'total_amount', 'first_name'])
  sort?: 'po_number' | 'po_date' | 'vendor_name' | 'total_amount' | 'first_name';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  direction?: 'asc' | 'desc';
}

export class PurchaseOrderItemDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  itemName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  partNumber?: string;

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

export class SavePurchaseOrderDto {
  @IsString()
  @MaxLength(40)
  poNumber!: string;

  @IsDateString()
  poDate!: string;

  @IsString()
  @MaxLength(4000)
  vendorDetails!: string;

  @IsString()
  @MaxLength(4000)
  billTo!: string;

  @IsString()
  @MaxLength(4000)
  shipTo!: string;

  @IsOptional()
  @IsString()
  @MaxLength(8000)
  termsConditions?: string;

  @IsIn(['NPR', 'USD'])
  currency!: 'NPR' | 'USD';

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderItemDto)
  items!: PurchaseOrderItemDto[];
}

export class PurgePurchaseOrderDto {
  @IsString()
  @MaxLength(200)
  password!: string;
}

export class DispatchPurchaseOrderDto {
  @IsEmail()
  @MaxLength(320)
  recipientEmail!: string;

  @IsString()
  @MaxLength(200)
  emailSubject!: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  emailBodyNotes?: string;

  @IsString()
  @MaxLength(40)
  poNumber!: string;
}
