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

export class DeliveryOrderItemDto {
  @IsOptional()
  @IsUUID()
  assetId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  serviceName?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1_000_000)
  quantity!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitPrice?: number;
}

export class CreateDeliveryOrderDto {
  @IsDateString()
  deliveryDate!: string;

  @IsString()
  @MaxLength(255)
  customerName!: string;

  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  contactName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  contactPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  deliveryAddress?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsOptional()
  @IsBoolean()
  billable?: boolean;

  @IsOptional()
  @IsIn([15, 90, 180, 365])
  returnValidityDays?: 15 | 90 | 180 | 365;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  sourceBillNo?: string;

  @IsOptional()
  @IsUUID()
  soldById?: string;

  @IsOptional()
  @IsUUID()
  leadId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  discountValue?: number;

  @IsOptional()
  @IsIn(['percent', 'fixed', 'amount'])
  discountType?: 'percent' | 'fixed' | 'amount';

  @IsOptional()
  @IsBoolean()
  taxable?: boolean;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => DeliveryOrderItemDto)
  items!: DeliveryOrderItemDto[];
}

export class UpdateDeliveryLineDto {
  @IsUUID()
  id!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitPrice!: number;
}

export class UpdateDeliveryOrderDto {
  @IsDateString()
  deliveryDate!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  sourceBillNo?: string;

  @IsOptional()
  @IsUUID()
  soldById?: string;

  @IsOptional()
  @IsUUID()
  leadId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  discountValue?: number;

  @IsOptional()
  @IsIn(['percent', 'fixed', 'amount'])
  discountType?: 'percent' | 'fixed' | 'amount';

  @IsOptional()
  @IsBoolean()
  taxable?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateDeliveryLineDto)
  items!: UpdateDeliveryLineDto[];
}

export class PurgeDeliveryOrderDto {
  @IsString()
  @MaxLength(200)
  password!: string;
}
