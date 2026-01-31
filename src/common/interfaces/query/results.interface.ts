/**
 * Pagination Result
 */
export interface PaginationResult<E> {
  data: E[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Update Many Result
 */
export interface UpdateManyResult {
  affected: number;
}

/**
 * Delete Many Result
 */
export interface DeleteManyResult {
  deleted: number;
}
