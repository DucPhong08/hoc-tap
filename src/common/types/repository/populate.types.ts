import type { Paths } from './util.types';
import type { FilterRule } from './filter.types';

type Target<E, P> = P extends keyof E ? NonNullable<E[P]> : any;

export interface PopulationOptions<
  E extends object,
  P extends Paths<E> = Paths<E>,
> {
  /** Tên trường (relation) cần nạp (Mongoose style: path) */
  path: P;
  /** Chọn các trường cần lấy (Mongoose style: select: { id: 1, name: 1 }) */
  select?: Partial<Record<Paths<Target<E, P>>, 1 | 0>> | Paths<Target<E, P>>[];
  /** Điều kiện lọc (filter) chỉ áp dụng cho relation này (Mongoose style: filters) */
  filters?: FilterRule<Target<E, P>>[];
  sort?: Partial<Record<Paths<Target<E, P>>, 1 | -1>>;
  /** Số lượng bản ghi tối đa lấy ra cho relation này */
  limit?: number;
  population?: PopulationQuery<Target<E, P>>[];
}

export type PopulationQuery<E extends object> =
  | Paths<E>
  | {
      [P in Paths<E>]: PopulationOptions<E, P>;
    }[Paths<E>];
