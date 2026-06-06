import type { QueryOrder } from '@mikro-orm/core';
import type { Paths } from './util.types';
import type { FilterRule } from './filter.types';

export interface PopulationOptions<E extends object> {
  /** Tên trường (relation) cần nạp (Mongoose style: path) */
  path: Paths<E> | (string & {});
  /** Chọn các trường cần lấy (Mongoose style: select: { id: 1, name: 1 }) */
  select?: Record<string, 1 | 0> | string[];
  /** Điều kiện lọc (filter) chỉ áp dụng cho relation này (Mongoose style: filters) */
  filters?: FilterRule<any>[];
  /** Sắp xếp kết quả của relation này */
  sort?:
    | {
        [K in Paths<E>]?: 1 | -1 | QueryOrder;
      }
    | { [K: string]: 1 | -1 | QueryOrder }
    | string
    | string[];
  /** Số lượng bản ghi tối đa lấy ra cho relation này */
  limit?: number;
  /** Nạp thêm các relation con nằm sâu bên trong (Nested Populate) */
  population?: PopulationQuery<any>[];
}

export type PopulationQuery<E extends object> =
  | Paths<E>
  | (string & {})
  | PopulationOptions<E>;
