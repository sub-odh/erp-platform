import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const customerSortFields = [
  'customerCode',
  'name',
  'createdAt',
  'updatedAt',
] as const;

export type CustomerSortField = (typeof customerSortFields)[number];

export const sortDirections = ['asc', 'desc'] as const;

export type SortDirection = (typeof sortDirections)[number];

export class ListCustomersQueryDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @Transform(({ value }) => {
    if (value === undefined) {
      return undefined;
    }

    if (value === true || value === 'true') {
      return true;
    }

    if (value === false || value === 'false') {
      return false;
    }

    return value;
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

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
  @IsIn(customerSortFields)
  sortBy: CustomerSortField = 'createdAt';

  @IsOptional()
  @IsIn(sortDirections)
  sortDirection: SortDirection = 'desc';
}
