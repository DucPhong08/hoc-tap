/**
 * Pagination Result
 */
export interface PaginationResult<E> {
  data: E[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
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
