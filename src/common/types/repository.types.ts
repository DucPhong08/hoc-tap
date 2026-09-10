import type {
  FilterQuery,
  FindOptions as MikroFindOptions,
} from '@mikro-orm/core';
import { OperatorType } from '@/common/enums/operator-type.enum';
import type { IAuthUser } from '@/common/interfaces/auth-user.interface';

/* ---------- Path helpers ---------- */
type Prev = [never, 0, 1, 2, 3, 4];

export type Paths<T, D extends number = 3> = [D] extends [never]
  ? never
  : T extends Date | RegExp | ((...args: any[]) => any)
    ? never
    : T extends { toHexString(): string } // Exclude ObjectId
      ? never
      : T extends { getItems(): infer U } // MikroORM Collection
        ? Paths<U, D>
        : T extends Array<infer U>
          ? Paths<U, D>
          : T extends object
            ? {
                [K in keyof T & (string | number)]: T[K] extends (
                  ...args: any[]
                ) => any
                  ? never
                  : `${K}` | `${K}.${Paths<T[K], Prev[D]>}`;
              }[keyof T & (string | number)]
            : never;

/* ---------- Filter rules ---------- */
export interface FilterRule<E = any> {
  field: Paths<E> | string[];
  operator: OperatorType;
  values?: any;
}

export type QueryCondition<E> = FilterQuery<E> | FilterRule<E>[];

/* ---------- Population ---------- */
type Target<E, P> = P extends keyof E ? NonNullable<E[P]> : any;

export interface PopulationOptions<
  E extends object,
  P extends Paths<E> = Paths<E>,
> {
  path: P;
  select?: Partial<Record<Paths<Target<E, P>>, 1 | 0>>;
  filters?: FilterRule<Target<E, P>>[];
  sort?: Partial<Record<Paths<Target<E, P>>, 1 | -1>>;
  limit?: number;
  population?: PopulationQuery<Target<E, P>>[];
}

export type PopulationQuery<E extends object> = {
  [P in Paths<E>]: PopulationOptions<E, P>;
}[Paths<E>];

/* ---------- Query options ---------- */
export interface BaseOptions<T = unknown> {
  transaction?: T;
  user?: IAuthUser;
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
  softDelete?: boolean;
}

export interface FindQuery<
  E extends object = any,
  TContext = unknown,
> extends QueryOptions<TContext, E> {
  select?: Partial<Record<Paths<E>, 1 | 0>>;
  filters?: FilterRule<E>[];
  population?: PopulationQuery<E>[];
  page?: number;
  limit?: number;
  sort?: Partial<Record<Paths<E>, 1 | -1>>;
  soft?: boolean;
}

export interface RepositoryPopulateConfig<E extends object = any> {
  getById?: PopulationQuery<E>[];
  getOne?: PopulationQuery<E>[];
  getMany?: PopulationQuery<E>[];
  getPage?: PopulationQuery<E>[];
}

export interface RepositoryConfig<E extends object = any> {
  populate?: RepositoryPopulateConfig<E>;
}

/* ---------- Update data & operators ---------- */
export type NumericFieldMap<E> = Partial<{
  [K in keyof E as NonNullable<E[K]> extends number ? K : never]: number;
}>;

type IsArray<T> =
  NonNullable<T> extends readonly unknown[]
    ? true
    : NonNullable<T> extends { getItems(): unknown }
      ? true
      : false;

export type ArrayItem<T> =
  NonNullable<T> extends readonly (infer I)[]
    ? I
    : NonNullable<T> extends { getItems(): readonly (infer I)[] }
      ? I
      : never;

export type ArrayFieldMap<E> = Partial<{
  [K in keyof E as IsArray<E[K]> extends true ? K : never]:
    | ArrayItem<E[K]>
    | ArrayItem<E[K]>[];
}>;

export type UpdateOperator<E> = {
  $set?: Partial<E>;
  $inc?: NumericFieldMap<E>;
  $unset?: Partial<Record<keyof E, boolean>>;
  $push?: ArrayFieldMap<E>;
  $pull?: ArrayFieldMap<E>;
};

export type UpdateData<E> = Partial<E> | UpdateOperator<E>;

/* ---------- Results ---------- */
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
