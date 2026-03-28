// ============================================================================
// Query Conditions & Operators
// ============================================================================

export type ComparisonOperator<T> = {
  $eq?: T;
  $ne?: T;
  $gt?: T;
  $gte?: T;
  $lt?: T;
  $lte?: T;
  $in?: T[];
  $nin?: T[];
  $like?: string | RegExp;
  $ilike?: string;
  $regex?: string | RegExp;
  $exists?: boolean;
  $not?: ComparisonOperator<T>;
};

export type FieldCondition<T> = T | ComparisonOperator<T>;

export type WhereCondition<E> = {
  [P in keyof E]?: FieldCondition<E[P]>;
} & {
  $and?: WhereCondition<E>[];
  $or?: WhereCondition<E>[];
  $not?: WhereCondition<E>;
};

export type QueryCondition<E> = WhereCondition<E>;

// ============================================================================
// Update Operators
// ============================================================================

export type UpdateOperator<E> = {
  $set?: Partial<E>;
  $inc?: Partial<Record<keyof E, number>>;
  $unset?: Partial<Record<keyof E, boolean>>;
  $push?: Partial<Record<keyof E, any>>;
  $pull?: Partial<Record<keyof E, any>>;
};

export type UpdateData<E> = Partial<E> | UpdateOperator<E>;

// ============================================================================
// Populate (JOIN) Options
// ============================================================================

export type PopulateField = string;

export type PopulateOptions = {
  path: string;
  select?: string[];
  populate?: PopulateField[] | PopulateOptions[];
  sort?: Record<string, 1 | -1>;
  limit?: number;
};

export type PopulateInput = PopulateField[] | PopulateOptions[];

// ============================================================================
// Base Options for Queries and Commands
// ============================================================================

export interface QueryOptions<T = unknown> {
  transaction?: T;
  withDeleted?: boolean;
}

export interface CommandOptions<T = unknown> {
  transaction?: T;
  plain?: boolean;
}

// ============================================================================
// Find Query (Unified for getById, getOne, getMany, getPage)
// ============================================================================

export interface FindQuery<E> {
  select?: (keyof E)[];
  populate?: PopulateInput;
  sort?: Partial<Record<keyof E, 1 | -1>>;
  limit?: number;
  offset?: number;
  page?: number;
  withDeleted?: boolean;
}

// ============================================================================
// Command Options
// ============================================================================

export interface CreateCommand {
  populate?: PopulateInput;
}

export interface UpdateCommand {
  populate?: PopulateInput;
  upsert?: boolean;
  new?: boolean;
}

export interface DeleteCommand {
  soft?: boolean;
}

export interface BulkCommand {
  ordered?: boolean;
  upsert?: boolean;
  new?: boolean;
}

// ============================================================================
// Result Types
// ============================================================================

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
