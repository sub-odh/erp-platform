import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

const GUARANTEE_TYPES = ['BG', 'PG'] as const;
const GUARANTEE_STATUSES = ['ACTIVE', 'RELEASED'] as const;

export class ListGuaranteesQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @IsOptional()
  @IsIn(GUARANTEE_TYPES)
  guaranteeType?: (typeof GUARANTEE_TYPES)[number];

  @IsOptional()
  @IsIn(GUARANTEE_STATUSES)
  status?: (typeof GUARANTEE_STATUSES)[number];
}

export class CreateGuaranteeDto {
  @IsIn(GUARANTEE_TYPES)
  guaranteeType!: (typeof GUARANTEE_TYPES)[number];

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  clientName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  tenderDetails!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  bankNameBranch!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount!: number;

  @IsDateString()
  submissionDate!: string;

  @IsDateString()
  expiryDate!: string;

  @IsOptional()
  @IsString()
  @MaxLength(155)
  assignedPerson?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  documentUrl?: string | null;
}

export class UpdateGuaranteeDto {
  @IsOptional()
  @IsIn(GUARANTEE_TYPES)
  guaranteeType?: (typeof GUARANTEE_TYPES)[number];

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  clientName?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  tenderDetails?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  bankNameBranch?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsDateString()
  submissionDate?: string;

  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(155)
  assignedPerson?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  documentUrl?: string | null;
}

export class ReleaseGuaranteeDto {
  @IsDateString()
  releaseDate!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  releaseRemarks?: string | null;
}
