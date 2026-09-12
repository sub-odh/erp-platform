import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

export const SUPPORT_VISIT_TYPES = ['REMOTE', 'ONCALL', 'ONPREMISE'] as const;
export const SUPPORT_VISIT_STATUSES = [
  'PENDING',
  'ONGOING',
  'RESOLVED',
  'ESCALATED',
] as const;

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;

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

export class CreateSupportVisitDto {
  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  clientName!: string;

  @IsOptional()
  @IsUUID()
  customerId?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  @MaxLength(100)
  deptName?: string | null;

  @IsDateString()
  visitDate!: string;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  @Matches(TIME_PATTERN, { message: 'Client call time must be HH:MM or HH:MM:SS' })
  clientCallTime?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  @Matches(TIME_PATTERN, { message: 'Time started must be HH:MM or HH:MM:SS' })
  timeStarted?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  @Matches(TIME_PATTERN, { message: 'Time ended must be HH:MM or HH:MM:SS' })
  timeEnded?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  @MaxLength(20)
  totalHours?: string | null;

  @IsOptional()
  @IsIn(SUPPORT_VISIT_TYPES)
  visitType?: (typeof SUPPORT_VISIT_TYPES)[number];

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  @MaxLength(50)
  priority?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  issueDescription?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  actionTaken?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  partsUsed?: string | null;

  @IsOptional()
  @IsIn(SUPPORT_VISIT_STATUSES)
  status?: (typeof SUPPORT_VISIT_STATUSES)[number];

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  teamMembers?: string | null;

  @IsOptional()
  @IsUUID()
  technicianId?: string | null;
}

export class UpdateSupportVisitDto {
  @Transform(({ value }) => trimString(value))
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  clientName?: string;

  @IsOptional()
  @IsUUID()
  customerId?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  @MaxLength(100)
  deptName?: string | null;

  @IsOptional()
  @IsDateString()
  visitDate?: string;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  @Matches(TIME_PATTERN, { message: 'Client call time must be HH:MM or HH:MM:SS' })
  clientCallTime?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  @Matches(TIME_PATTERN, { message: 'Time started must be HH:MM or HH:MM:SS' })
  timeStarted?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  @Matches(TIME_PATTERN, { message: 'Time ended must be HH:MM or HH:MM:SS' })
  timeEnded?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  @MaxLength(20)
  totalHours?: string | null;

  @IsOptional()
  @IsIn(SUPPORT_VISIT_TYPES)
  visitType?: (typeof SUPPORT_VISIT_TYPES)[number];

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  @MaxLength(50)
  priority?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  issueDescription?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  actionTaken?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  partsUsed?: string | null;

  @IsOptional()
  @IsIn(SUPPORT_VISIT_STATUSES)
  status?: (typeof SUPPORT_VISIT_STATUSES)[number];

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  teamMembers?: string | null;

  @IsOptional()
  @IsUUID()
  technicianId?: string | null;
}
