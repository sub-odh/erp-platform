import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

function trimString(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

function emptyStringToUndefined(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();

  return trimmed.length === 0 ? undefined : trimmed;
}

function normalizeEmail(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  const normalized = value.trim().toLowerCase();

  return normalized.length === 0 ? undefined : normalized;
}

function normalizeCustomerCode(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  return value.trim().toUpperCase();
}

export class CreateCustomerDto {
  @Transform(({ value }) => normalizeCustomerCode(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  customerCode!: string;

  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @Transform(({ value }) => emptyStringToUndefined(value))
  @IsOptional()
  @IsString()
  @MaxLength(200)
  legalName?: string;

  @Transform(({ value }) => emptyStringToUndefined(value))
  @IsOptional()
  @IsString()
  @MaxLength(100)
  taxNumber?: string;

  @Transform(({ value }) => normalizeEmail(value))
  @IsOptional()
  @IsEmail()
  @MaxLength(320)
  email?: string;

  @Transform(({ value }) => emptyStringToUndefined(value))
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @Transform(({ value }) => emptyStringToUndefined(value))
  @IsOptional()
  @IsUrl({
    require_protocol: true,
  })
  @MaxLength(500)
  website?: string;

  @Transform(({ value }) => emptyStringToUndefined(value))
  @IsOptional()
  @IsString()
  @MaxLength(255)
  billingAddressLine1?: string;

  @Transform(({ value }) => emptyStringToUndefined(value))
  @IsOptional()
  @IsString()
  @MaxLength(255)
  billingAddressLine2?: string;

  @Transform(({ value }) => emptyStringToUndefined(value))
  @IsOptional()
  @IsString()
  @MaxLength(100)
  billingCity?: string;

  @Transform(({ value }) => emptyStringToUndefined(value))
  @IsOptional()
  @IsString()
  @MaxLength(100)
  billingState?: string;

  @Transform(({ value }) => emptyStringToUndefined(value))
  @IsOptional()
  @IsString()
  @MaxLength(30)
  billingPostalCode?: string;

  @Transform(({ value }) => emptyStringToUndefined(value))
  @IsOptional()
  @IsString()
  @MaxLength(100)
  billingCountry?: string;

  @Transform(({ value }) => emptyStringToUndefined(value))
  @IsOptional()
  @IsString()
  @MaxLength(255)
  shippingAddressLine1?: string;

  @Transform(({ value }) => emptyStringToUndefined(value))
  @IsOptional()
  @IsString()
  @MaxLength(255)
  shippingAddressLine2?: string;

  @Transform(({ value }) => emptyStringToUndefined(value))
  @IsOptional()
  @IsString()
  @MaxLength(100)
  shippingCity?: string;

  @Transform(({ value }) => emptyStringToUndefined(value))
  @IsOptional()
  @IsString()
  @MaxLength(100)
  shippingState?: string;

  @Transform(({ value }) => emptyStringToUndefined(value))
  @IsOptional()
  @IsString()
  @MaxLength(30)
  shippingPostalCode?: string;

  @Transform(({ value }) => emptyStringToUndefined(value))
  @IsOptional()
  @IsString()
  @MaxLength(100)
  shippingCountry?: string;

  @Type(() => Number)
  @IsOptional()
  @IsNumber({
    maxDecimalPlaces: 2,
  })
  @Min(0)
  creditLimit?: number;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(99999)
  paymentTermsDays?: number;

  @Transform(({ value }) => emptyStringToUndefined(value))
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
