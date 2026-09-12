import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export const FIELD_VISIT_TYPES = [
  'CLIENT_MEETING',
  'TECHNICAL_SUPPORT',
  'BANK',
  'CUSTOMS',
  'OTHER',
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

export class CreateFieldVisitDto {
  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  agenda!: string;

  @IsIn(FIELD_VISIT_TYPES)
  visitType!: (typeof FIELD_VISIT_TYPES)[number];

  @Transform(({ value }) => trimString(value))
  @IsString()
  @Matches(TIME_PATTERN, { message: 'Out time must be HH:MM or HH:MM:SS' })
  outTime!: string;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  @Matches(TIME_PATTERN, { message: 'In time must be HH:MM or HH:MM:SS' })
  inTime?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  remarks?: string | null;

  @IsDateString()
  visitDate!: string;
}

export class UpdateFieldVisitDto {
  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @Matches(TIME_PATTERN, { message: 'In time must be HH:MM or HH:MM:SS' })
  inTime!: string;
}
