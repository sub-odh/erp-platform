import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export const ASSIGNABLE_LEAD_STATUSES = [
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'DISQUALIFIED',
] as const;

export type AssignableLeadStatus = (typeof ASSIGNABLE_LEAD_STATUSES)[number];

const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

const trimOptionalString = ({ value }: { value: unknown }): unknown => {
  if (typeof value !== 'string') {
    return value;
  }

  const normalized = value.trim();

  return normalized.length > 0 ? normalized : undefined;
};

const normalizeEmail = ({ value }: { value: unknown }): unknown => {
  if (typeof value !== 'string') {
    return value;
  }

  const normalized = value.trim().toLowerCase();

  return normalized.length > 0 ? normalized : undefined;
};

export class CreateLeadDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Transform(trimString)
  firstName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Transform(trimString)
  lastName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(trimOptionalString)
  companyName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  @Transform(trimOptionalString)
  jobTitle?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(320)
  @Transform(normalizeEmail)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(trimOptionalString)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(trimOptionalString)
  mobile?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(trimOptionalString)
  source?: string;

  @IsOptional()
  @IsIn(ASSIGNABLE_LEAD_STATUSES)
  status?: AssignableLeadStatus;

  @IsOptional()
  @IsUUID()
  ownerUserId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  @Transform(trimOptionalString)
  notes?: string;
}
