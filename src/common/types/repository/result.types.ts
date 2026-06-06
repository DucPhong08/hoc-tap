export interface PaginationResult<E> {
  data: E[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface BulkWriteResult {
  affected: number;
}

export interface BulkDeleteResult {
  deleted: number;
}
