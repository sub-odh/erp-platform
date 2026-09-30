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

export class ListProformaInvoicesQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  searchCustomer?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  searchPiNum?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsIn([
    'pi_number',
    'pi_date',
    'customer_details',
    'total_amount',
    'first_name',
  ])
  sort?:
    | 'pi_number'
    | 'pi_date'
    | 'customer_details'
    | 'total_amount'
    | 'first_name';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  direction?: 'asc' | 'desc';
}

export class ProformaItemDto {
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

export class SaveProformaInvoiceDto {
  @IsString()
  @MaxLength(40)
  piNumber!: string;

  @IsDateString()
  piDate!: string;

  @IsString()
  @MaxLength(4000)
  customerDetails!: string;

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
  @Type(() => ProformaItemDto)
  items!: ProformaItemDto[];
}

export class PurgeProformaInvoiceDto {
  @IsString()
  @MaxLength(200)
  password!: string;
}

export class DispatchProformaInvoiceDto {
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
  piNumber!: string;
}
