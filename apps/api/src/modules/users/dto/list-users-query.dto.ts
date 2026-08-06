import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const USER_LIST_STATUSES = [
  'active',
  'inactive',
  'archived',
  'all',
] as const;

export type UserListStatus = (typeof USER_LIST_STATUSES)[number];

export const USER_LIST_ROLES = ['OWNER', 'ADMIN', 'MANAGER', 'STAFF'] as const;

export type UserListRole = (typeof USER_LIST_ROLES)[number];

export const USER_SORT_FIELDS = [
  'firstName',
  'email',
  'role',
  'lastLoginAt',
  'createdAt',
] as const;

export type UserSortField = (typeof USER_SORT_FIELDS)[number];

export const USER_SORT_DIRECTIONS = ['asc', 'desc'] as const;

export type UserSortDirection = (typeof USER_SORT_DIRECTIONS)[number];

export class ListUsersQueryDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @IsOptional()
  @IsIn(USER_LIST_STATUSES)
  status: UserListStatus = 'active';

  @IsOptional()
  @IsIn(USER_LIST_ROLES)
  role?: UserListRole;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  page: number = 1;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @IsOptional()
  @IsIn(USER_SORT_FIELDS)
  sortBy: UserSortField = 'createdAt';

  @IsOptional()
  @IsIn(USER_SORT_DIRECTIONS)
  sortDirection: UserSortDirection = 'desc';
}
