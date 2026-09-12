import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const HALL_STATUSES = ['ACTIVE', 'MAINTENANCE'] as const;
export const HALL_ARRANGEMENTS = [
  'THEATER',
  'U_SHAPE',
  'BOARDROOM',
  'CLASSROOM',
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

export class CreateHallDto {
  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  hallName!: string;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  @MaxLength(100)
  location?: string | null;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5000)
  capacity?: number | null;

  @IsOptional()
  @IsIn(HALL_ARRANGEMENTS)
  arrangementType?: (typeof HALL_ARRANGEMENTS)[number];

  @IsOptional()
  @IsIn(HALL_STATUSES)
  status?: (typeof HALL_STATUSES)[number];
}

export class UpdateHallDto {
  @Transform(({ value }) => trimString(value))
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  hallName?: string;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  @MaxLength(100)
  location?: string | null;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5000)
  capacity?: number | null;

  @IsOptional()
  @IsIn(HALL_ARRANGEMENTS)
  arrangementType?: (typeof HALL_ARRANGEMENTS)[number];

  @IsOptional()
  @IsIn(HALL_STATUSES)
  status?: (typeof HALL_STATUSES)[number];
}

export class CreateHallBookingDto {
  @IsUUID()
  hallId!: string;

  @IsDateString()
  bookingDate!: string;

  @Transform(({ value }) => trimString(value))
  @IsString()
  @Matches(TIME_PATTERN, { message: 'Start time must be HH:MM or HH:MM:SS' })
  startTime!: string;

  @Transform(({ value }) => trimString(value))
  @IsString()
  @Matches(TIME_PATTERN, { message: 'End time must be HH:MM or HH:MM:SS' })
  endTime!: string;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reason?: string | null;
}
