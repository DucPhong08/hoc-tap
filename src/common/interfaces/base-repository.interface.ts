import { BaseEntity } from '../entity/base.entity';

// Query operators
export type QueryOperators<T> = {
  $eq?: T;
  $ne?: T;
  $in?: T[];
  $nin?: T[];
  $gt?: T;
  $gte?: T;
  $lt?: T;
  $lte?: T;
  $like?: string;
  $ilike?: string;
  $re?: string;
};

// Query conditions with operators
export type QueryCondition<E = any> = {
  [P in keyof E]?: E[P] | QueryOperators<E[P]>;
} & {
  $and?: QueryCondition<E>[];
  $or?: QueryCondition<E>[];
  [key: string]: any;
};

// Update operations
export type UpdateDocument<E> =
  | Partial<E>
  | {
      $set?: Partial<E>;
      $inc?: Partial<Record<keyof E, number>>;
      $unset?: Partial<Record<keyof E, boolean>>;
    };

// Sort order
export enum SortOrder {
  ASC = 1,
  DESC = -1,
}

// Query options
export interface QueryOptions<E = any> {
  select?: (keyof E)[];
  populate?: string[] | Record<string, boolean | QueryOptions>;
  sort?:
    | Partial<Record<keyof E, SortOrder | 1 | -1>>
    | Record<string, SortOrder | 1 | -1>;
  limit?: number;
  offset?: number;
}

// Pagination result
export interface PaginationResult<E> {
  data: E[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Base repository interface
export interface BaseRepository<E extends BaseEntity> {
  create(data: Partial<E>): Promise<E>;

  getById(id: string, options?: QueryOptions<E>): Promise<E | null>;

  getOne(
    conditions: QueryCondition<E>,
    options?: QueryOptions<E>,
  ): Promise<E | null>;

  getMany(
    conditions?: QueryCondition<E>,
    options?: QueryOptions<E>,
  ): Promise<E[]>;

  getPage(
    conditions: QueryCondition<E>,
    page: number,
    limit: number,
    options?: QueryOptions<E>,
  ): Promise<PaginationResult<E>>;

  updateById(id: string, update: UpdateDocument<E>): Promise<E | null>;

  updateOne(
    conditions: QueryCondition<E>,
    update: UpdateDocument<E>,
  ): Promise<E | null>;

  updateMany(
    conditions: QueryCondition<E>,
    update: UpdateDocument<E>,
  ): Promise<{ affected: number }>;

  deleteById(id: string): Promise<E | null>;

  deleteOne(conditions: QueryCondition<E>): Promise<E | null>;

  deleteMany(conditions: QueryCondition<E>): Promise<{ deleted: number }>;

  count(conditions?: QueryCondition<E>): Promise<number>;

  exists(conditions: QueryCondition<E>): Promise<boolean>;
}
