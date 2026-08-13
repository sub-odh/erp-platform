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

export const OPPORTUNITY_STATUSES = ['OPEN', 'WON', 'LOST'] as const;

export type OpportunityStatus = (typeof OPPORTUNITY_STATUSES)[number];

export const OPPORTUNITY_RECORD_STATES = ['active', 'archived', 'all'] as const;

export type OpportunityRecordState = (typeof OPPORTUNITY_RECORD_STATES)[number];

export const OPPORTUNITY_SORT_FIELDS = [
  'name',
  'amount',
  'probability',
  'expectedCloseDate',
  'createdAt',
  'updatedAt',
] as const;

export type OpportunitySortField = (typeof OPPORTUNITY_SORT_FIELDS)[number];

export const OPPORTUNITY_SORT_DIRECTIONS = ['asc', 'desc'] as const;

export type OpportunitySortDirection =
  (typeof OPPORTUNITY_SORT_DIRECTIONS)[number];

export class ListOpportunitiesQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  search?: string;

  @IsOptional()
  @IsIn(OPPORTUNITY_STATUSES)
  status?: OpportunityStatus;

  @IsOptional()
  @IsIn(OPPORTUNITY_RECORD_STATES)
  recordState: OpportunityRecordState = 'active';

  @IsOptional()
  @IsUUID()
  stageId?: string;

  @IsOptional()
  @IsUUID()
  ownerUserId?: string;

  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @IsUUID()
  leadId?: string;

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
  @IsIn(OPPORTUNITY_SORT_FIELDS)
  sortBy: OpportunitySortField = 'createdAt';

  @IsOptional()
  @IsIn(OPPORTUNITY_SORT_DIRECTIONS)
  sortDirection: OpportunitySortDirection = 'desc';
}
