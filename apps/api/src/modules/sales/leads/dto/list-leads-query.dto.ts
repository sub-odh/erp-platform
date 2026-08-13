import { Transform, Type } from 'class-transformer';

import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const LEAD_STATUSES = [
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'DISQUALIFIED',
  'CONVERTED',
] as const;

export type LeadStatusFilter = (typeof LEAD_STATUSES)[number];

export const LEAD_RECORD_STATES = ['active', 'archived', 'all'] as const;

export type LeadRecordState = (typeof LEAD_RECORD_STATES)[number];

export const LEAD_SORT_FIELDS = [
  'firstName',
  'lastName',
  'companyName',
  'status',
  'createdAt',
  'updatedAt',
] as const;

export type LeadSortField = (typeof LEAD_SORT_FIELDS)[number];

export const SORT_DIRECTIONS = ['asc', 'desc'] as const;

export type SortDirection = (typeof SORT_DIRECTIONS)[number];

export class ListLeadsQueryDto {
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(200)
  search?: string;

  @IsOptional()
  @IsIn(LEAD_STATUSES)
  status?: LeadStatusFilter;

  @IsOptional()
  @IsUUID()
  ownerUserId?: string;

  @IsOptional()
  @IsIn(LEAD_RECORD_STATES)
  recordState: LeadRecordState = 'active';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  @IsOptional()
  @IsIn(LEAD_SORT_FIELDS)
  sortBy: LeadSortField = 'createdAt';

  @IsOptional()
  @IsIn(SORT_DIRECTIONS)
  sortDirection: SortDirection = 'desc';
}
