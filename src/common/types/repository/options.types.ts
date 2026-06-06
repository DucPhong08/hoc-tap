import type {
  FindOptions as MikroFindOptions,
  NativeInsertUpdateOptions as MikroNativeInsertUpdateOptions,
  QueryOrder,
} from '@mikro-orm/core';
import type { Paths } from './util.types';
import type { PopulationQuery } from './populate.types';

export interface BaseOptions<T = unknown> {
  /** Đối tượng transaction context (EntityManager) dùng để chạy transaction đồng bộ */
  transaction?: T;
}

export interface QueryOptions<T = unknown, E extends object = any>
  extends
    BaseOptions<T>,
    Pick<
      MikroFindOptions<E, any, any, any>,
      | 'disableIdentityMap'
      | 'cache'
      | 'strategy'
      | 'lockMode'
      | 'lockTableAliases'
      | 'connectionType'
      | 'indexHint'
    > {
  /** true nếu muốn lấy cả các bản ghi đã bị xóa tạm  */
  softDelete?: boolean;
}

export interface CommandOptions<T = unknown, E extends object = any>
  extends BaseOptions<T>, Omit<MikroNativeInsertUpdateOptions<E>, 'ctx'> {
  /** Các quan hệ liên kết cần nạp trước (Eager load / Populate) ngay sau khi ghi đè dữ liệu */
  population?: PopulationQuery<E>[];
  /** Buộc nạp lại từ DB và làm mới dữ liệu trong bộ nhớ RAM của ORM */
  refresh?: boolean;
}

export interface FindQuery<
  E extends object = any,
  TContext = unknown,
> extends QueryOptions<TContext, E> {
  /** Danh sách các trường (fields) cần lấy ra để tối ưu hóa hiệu năng select (Alias của fields) */
  select?: Paths<E>[] | string[] | Record<string, 1 | 0>;
  /** Các quan hệ liên kết cần nạp trước (Eager load / Populate) để tránh lỗi N+1 queries (Alias của populate) */
  population?: PopulationQuery<E>[];
  /** Sắp xếp kết quả (Sort/OrderBy) ví dụ: { createdAt: 'desc' }, { createdAt: -1 }, 'createdAt', or '-createdAt' */
  sort?:
    | {
        [K in Paths<E>]?: 1 | -1 | QueryOrder;
      }
    | { [K: string]: 1 | -1 | QueryOrder }
    | string
    | string[];
  /** Buộc nạp lại từ DB và làm mới dữ liệu trong bộ nhớ RAM của ORM */
  refresh?: boolean;
}

export interface DeleteCommand {
  soft?: boolean;
}
