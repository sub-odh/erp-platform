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

import {
  ASSIGNABLE_LEAD_STATUSES,
  type AssignableLeadStatus,
} from './create-lead.dto';

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
  @IsString()
  @MaxLength(200)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  search?: string;

  @IsOptional()
  @IsIn(ASSIGNABLE_LEAD_STATUSES)
  status?: AssignableLeadStatus;

  @IsOptional()
  @IsUUID()
  ownerUserId?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

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
