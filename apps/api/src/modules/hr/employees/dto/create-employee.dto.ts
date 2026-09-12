import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

export const EMPLOYEE_GENDERS = ['MALE', 'FEMALE', 'OTHERS'] as const;
export const EMPLOYEE_MARITAL_STATUSES = ['SINGLE', 'MARRIED'] as const;

function trimString(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

function emptyToNull(value: unknown): unknown {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();

  return trimmed.length === 0 ? null : trimmed;
}

function normalizeCode(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  return value.trim().toUpperCase();
}

function normalizeEmail(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  const normalized = value.trim().toLowerCase();

  return normalized.length === 0 ? null : normalized;
}

export class CreateEmployeeDto {
  @Transform(({ value }) => normalizeCode(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  employeeCode!: string;

  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName!: string;

  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName!: string;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsUUID()
  userId?: string | null;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  attendanceDeviceId?: number | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  @MaxLength(255)
  fatherName?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  @MaxLength(255)
  motherName?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string | null;

  @IsOptional()
  @IsIn(EMPLOYEE_GENDERS)
  gender?: (typeof EMPLOYEE_GENDERS)[number] | null;

  @IsOptional()
  @IsIn(EMPLOYEE_MARITAL_STATUSES)
  maritalStatus?: (typeof EMPLOYEE_MARITAL_STATUSES)[number] | null;

  @Transform(({ value }) => emptyToNull(value))
  @ValidateIf((dto: CreateEmployeeDto) => dto.maritalStatus === 'MARRIED')
  @IsOptional()
  @IsString()
  @MaxLength(255)
  spouseName?: string | null;

  @Transform(({ value }) => normalizeEmail(value))
  @IsOptional()
  @IsEmail()
  @MaxLength(320)
  workEmail?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  @MaxLength(50)
  altPhone?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  @MaxLength(255)
  emergencyContactName?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  @MaxLength(50)
  emergencyContactPhone?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  @MaxLength(100)
  emergencyContactRelation?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  @MaxLength(100)
  citizenshipNumber?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  @MaxLength(100)
  panNumber?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  permanentAddress?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  currentAddress?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  @MaxLength(255)
  bankName?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  @MaxLength(255)
  bankBranch?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  @MaxLength(255)
  bankAccountName?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  @MaxLength(100)
  bankAccountNumber?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsDateString()
  joinDate?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsDateString()
  resignationDate?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  @MaxLength(100)
  designation?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  @MaxLength(100)
  department?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  qualification?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  pastExperience?: string | null;

  @Type(() => Number)
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  salary?: number | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsUUID()
  managerId?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @Matches(/^\d{4}-\d{2}$/)
  lastIncrementMonth?: string | null;

  @IsOptional()
  @IsBoolean()
  hasSalesTarget?: boolean;

  @Type(() => Number)
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  salesTarget?: number | null;

  @Type(() => Number)
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  yearlySalesTarget?: number | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsDateString()
  targetStartDate?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsDateString()
  targetEndDate?: string | null;
}
