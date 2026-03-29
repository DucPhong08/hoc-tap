import type { FilterQuery, FindOptions } from '@mikro-orm/core';

// ============================================================================
// Query Conditions & Operators
// ============================================================================

export type QueryCondition<E> = FilterQuery<E>;

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

export type PopulateInput = FindOptions<any>['populate'];

// ============================================================================
// Base Options for Queries and Commands
// ============================================================================

export interface QueryOptions<T = unknown> {
  transaction?: T;
  withDeleted?: boolean;
}

export interface CommandOptions<T = unknown> {
  transaction?: T;
}

// ============================================================================
// Find Query (Unified for getById, getOne, getMany, getPage)
// ============================================================================

export interface FindQuery<E> {
  select?: FindOptions<E>['fields'];
  populate?: PopulateInput;
  sort?: FindOptions<E>['orderBy'];
  limit?: FindOptions<E>['limit'];
  offset?: FindOptions<E>['offset'];
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
}

export interface DeleteCommand {
  soft?: boolean;
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
