import { PopulateInput } from './options.interface';

/**
 * Get By ID Query
 */
export interface GetByIdQuery<E = any> {
  select?: (keyof E | string)[];
  populate?: PopulateInput;
  withDeleted?: boolean;
}

/**
 * Get One Query
 */
export interface GetOneQuery<E = any> {
  select?: (keyof E | string)[];
  populate?: PopulateInput;
  sort?: Record<string, 1 | -1>;
  withDeleted?: boolean;
}

export interface GetManyQuery<E = any> {
  select?: (keyof E | string)[];
  populate?: PopulateInput;
  sort?: Record<string, 1 | -1>;
  limit?: number;
  offset?: number;
  withDeleted?: boolean;
}

/**
 * Get Page Query
 */
export interface GetPageQuery<E = any> {
  select?: (keyof E | string)[];
  populate?: PopulateInput;
  sort?: Record<string, 1 | -1>;
  page: number;
  limit: number;
  withDeleted?: boolean;
}

/**
 * Count Query
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface CountQuery<E = any> {
  withDeleted?: boolean;
}

/**
 * Exists Query
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface ExistsQuery<E = any> {
  withDeleted?: boolean;
}

/**
 * Create Query
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface CreateQuery<E = any> {
  populate?: PopulateInput;
}

/**
 * Insert Many Query
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-object-type
export interface InsertManyQuery<E = any> {
  // Options for bulk insert
}

/**
 * Update By ID Query
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface UpdateByIdQuery<E = any> {
  populate?: PopulateInput;
}

/**
 * Update One Query
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface UpdateOneQuery<E = any> {
  populate?: PopulateInput;
}

/**
 * Update Many Query
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-object-type
export interface UpdateManyQuery<E = any> {
  // Options for bulk update
}

/**
 * Delete By ID Query
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface DeleteByIdQuery<E = any> {
  soft?: boolean;
}

/**
 * Delete One Query
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface DeleteOneQuery<E = any> {
  soft?: boolean;
}

/**
 * Delete Many Query
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface DeleteManyQuery<E = any> {
  soft?: boolean;
}
