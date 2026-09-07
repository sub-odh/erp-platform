import { Type } from 'class-transformer';
import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const INVOICE_STATUSES = ['UNPAID', 'PARTIAL', 'PAID', 'VOID'] as const;
export const PAYMENT_METHODS = [
  'CASH',
  'BANK',
  'CHEQUE',
  'ONLINE',
  'OTHER',
] as const;

export class CreateInvoiceDto {
  @IsUUID()
  deliveryOrderId!: string;
}

export class ListInvoicesQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsIn(INVOICE_STATUSES)
  status?: (typeof INVOICE_STATUSES)[number];
}

export class RecordPaymentDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  @Max(100_000_000)
  amount!: number;

  @IsIn(PAYMENT_METHODS)
  method!: (typeof PAYMENT_METHODS)[number];

  @IsOptional()
  @IsString()
  @MaxLength(120)
  referenceNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  remarks?: string;
}
