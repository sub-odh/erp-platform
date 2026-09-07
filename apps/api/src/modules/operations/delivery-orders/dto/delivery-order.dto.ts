import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class DeliveryOrderItemDto {
  @IsUUID()
  assetId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1_000_000)
  quantity!: number;
}

export class CreateDeliveryOrderDto {
  @IsDateString()
  deliveryDate!: string;

  @IsString()
  @MaxLength(255)
  customerName!: string;

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

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => DeliveryOrderItemDto)
  items!: DeliveryOrderItemDto[];
}
