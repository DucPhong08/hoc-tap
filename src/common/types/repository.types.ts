import type {
  FilterQuery,
  FindOptions as MikroFindOptions,
  NativeInsertUpdateOptions as MikroNativeInsertUpdateOptions,
} from '@mikro-orm/core';

// ============================================================================
// Query Conditions & Operators
// ============================================================================

export type QueryCondition<E> = FilterQuery<E>;

// ============================================================================
// Update Operators
// ============================================================================

type NumericFieldMap<E> = Partial<{
  [K in keyof E as NonNullable<E[K]> extends number ? K : never]: number;
}>;

type ArrayItem<T> =
  NonNullable<T> extends readonly (infer Item)[] ? Item : never;

type ArrayFieldMap<E> = Partial<{
  [K in keyof E as NonNullable<E[K]> extends readonly unknown[]
    ? K
    : never]: ArrayItem<E[K]>;
}>;

export type UpdateOperator<E> = {
  $set?: Partial<E>;
  $inc?: NumericFieldMap<E>;
  $unset?: Partial<Record<keyof E, boolean>>;
  $push?: ArrayFieldMap<E>;
  $pull?: ArrayFieldMap<E>;
};

export type UpdateData<E> = Partial<E> | UpdateOperator<E>;

// ============================================================================
// Base Options for Queries and Commands
// ============================================================================

export interface BaseOptions<T = unknown> {
  /** Đối tượng transaction context (EntityManager) dùng để chạy transaction đồng bộ */
  transaction?: T;
}

export interface QueryOptions<T = unknown, E extends object = any>
  extends
    BaseOptions<T>,
    Omit<
      MikroFindOptions<E, any, any, any>,
      'ctx' | 'populate' | 'fields' | 'orderBy'
    > {
  /** true nếu muốn lấy cả các bản ghi đã bị xóa tạm  */
  softDelete?: boolean;
}

export interface CommandOptions<T = unknown, E extends object = any>
  extends BaseOptions<T>, Omit<MikroNativeInsertUpdateOptions<E>, 'ctx'> {
  /** Các quan hệ liên kết cần nạp trước (Eager load / Populate) ngay sau khi ghi đè dữ liệu */
  populate?: Paths<E>[];
  /** Buộc nạp lại từ DB và làm mới dữ liệu trong bộ nhớ RAM của ORM */
  refresh?: boolean;
}

// ============================================================================
// Deep Paths Utility for 100% Strict Type Checking (Nested & Autocomplete)
// ============================================================================

type Prev = [never, 0, 1, 2, 3, 4];

export type Paths<T, D extends number = 3> = [D] extends [never]
  ? never
  : T extends Date | RegExp
    ? never
    : T extends { getItems(): infer U } // Xử lý MikroORM Collection
      ? Paths<U, D>
      : T extends Array<infer U> // Xử lý Array thông thường
        ? Paths<U, D>
        : T extends object
          ? {
              [K in keyof T & (string | number)]:
                | `${K}`
                | `${K}.${Paths<T[K], Prev[D]>}`;
            }[keyof T & (string | number)]
          : never;

// ============================================================================
// Find Query (Unified for getById, getOne, getMany, getPage)
// ============================================================================

export interface FindQuery<
  E extends object = any,
  TContext = unknown,
> extends QueryOptions<TContext, E> {
  /** Danh sách các trường (fields) cần lấy ra để tối ưu hóa hiệu năng select (Alias của fields) */
  select?: Paths<E>[];
  /** Các quan hệ liên kết cần nạp trước (Eager load / Populate) để tránh lỗi N+1 queries (Alias của populate) */
  populate?: Paths<E>[];
  /** Sắp xếp kết quả (Sort/OrderBy) ví dụ: { createdAt: 'desc' } (Alias của orderBy) */
  sort?: MikroFindOptions<E, any, any, any>['orderBy'];
  /** Số lượng bản ghi tối đa cần lấy (limit) */
  limit?: MikroFindOptions<E, any, any, any>['limit'];
  /** Số lượng bản ghi cần bỏ qua (offset) */
  offset?: MikroFindOptions<E, any, any, any>['offset'];
  /** Số trang hiện tại dùng cho phân trang */
  page?: number;
  /** Buộc nạp lại từ DB và làm mới dữ liệu trong bộ nhớ RAM của ORM */
  refresh?: boolean;
}

// ============================================================================
// Command Options
// ============================================================================

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
