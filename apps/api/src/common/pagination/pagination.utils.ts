import type {
  PaginatedResult,
  PaginationInput,
  PaginationMeta,
} from './pagination.types';

export function getPaginationOffset({ page, limit }: PaginationInput): number {
  return (page - 1) * limit;
}

export function createPaginationMeta(
  page: number,
  limit: number,
  total: number,
): PaginationMeta {
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

export function createPaginatedResult<T>(
  data: T[],
  page: number,
  limit: number,
  total: number,
): PaginatedResult<T> {
  return {
    data,
    pagination: createPaginationMeta(page, limit, total),
  };
}
