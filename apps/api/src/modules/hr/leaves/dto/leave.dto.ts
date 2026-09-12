import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export const LEAVE_TYPES = ['ANNUAL', 'SICK', 'CASUAL'] as const;
export type LeaveTypeCode = (typeof LEAVE_TYPES)[number];

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

export class CreateLeaveRequestDto {
  @IsIn(LEAVE_TYPES)
  leaveType!: LeaveTypeCode;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  days!: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isHalfDay?: boolean;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reason?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsUUID()
  substituteId?: string | null;
}

export class CreateEmergencyLeaveDto {
  @IsUUID()
  employeeId!: string;

  @IsIn(LEAVE_TYPES)
  leaveType!: LeaveTypeCode;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  days!: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isHalfDay?: boolean;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reason?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  adminComment?: string | null;
}

export class ReviewLeaveDto {
  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  adminComment?: string | null;
}

export class LeaveBalanceUpdateItemDto {
  @IsUUID()
  employeeId!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  annualLeaveBal!: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  sickLeaveBal!: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  casualLeaveBal!: number;

  @Type(() => Boolean)
  @IsBoolean()
  annualLeaveEnabled!: boolean;
}

export class UpdateLeaveBalancesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => LeaveBalanceUpdateItemDto)
  employees!: LeaveBalanceUpdateItemDto[];
}
