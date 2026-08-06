import type { PaginatedResult, PaginationMeta } from './pagination.types';

export class PaginationMetaDto implements PaginationMeta {
  page!: number;
  limit!: number;
  total!: number;
  totalPages!: number;
  hasNextPage!: boolean;
  hasPreviousPage!: boolean;
}

export class PaginationResponseDto<T> implements PaginatedResult<T> {
  data!: T[];
  pagination!: PaginationMetaDto;
}
