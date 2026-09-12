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
      : T extends { getItems(): infer U } // Collection
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

/* ---------- Condition & Operators (ORM-Agnostic with Full Autocomplete) ---------- */
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
  [key: `${string}.${string}`]: any;
};

/* ---------- Filter rules ---------- */
export interface FilterRule<E = any> {
  field: Paths<E>;
  operator: OperatorType;
  values?: any;
}

export type QueryCondition<E> = WhereCondition<E> | FilterRule<E>[];

/* ---------- Population ---------- */
type Unwrap<T> = T extends { getItems(): (infer U)[] }
  ? NonNullable<U>
  : T extends (infer U)[]
    ? NonNullable<U>
    : T extends ReadonlyArray<infer U>
      ? NonNullable<U>
      : T extends { unwrap(): infer U }
        ? NonNullable<U>
        : T extends { getEntity(): infer U }
          ? NonNullable<U>
          : NonNullable<T>;

type IsPopulateTarget<T> = T extends object
  ? T extends
      | Date
      | RegExp
      | Uint8Array
      | { toHexString(): string }
      | ((...args: any[]) => any)
    ? false
    : true
  : false;

export type PopulateKey<E> = [keyof E] extends [never]
  ? string
  : string extends keyof E
    ? string
    : {
        [K in keyof E & string]: IsPopulateTarget<Unwrap<E[K]>> extends true
          ? K
          : never;
      }[keyof E & string];

export type Target<E, P> = P extends keyof E ? Unwrap<E[P]> : any;

export interface PopulationOptions<
  E extends object,
  P extends string = PopulateKey<E>,
> {
  path: P;
  select?: Partial<Record<Paths<Target<E, P>>, 1 | 0>>;
  filters?: FilterRule<Target<E, P>>[];
  sort?: Partial<Record<Paths<Target<E, P>>, 1 | -1>>;
  limit?: number;
  population?: PopulationQuery<Target<E, P>>[];
}

export type PopulationQuery<E extends object> = [PopulateKey<E>] extends [never]
  ? never
  : {
      [P in PopulateKey<E>]: PopulationOptions<E, P>;
    }[PopulateKey<E>];

/* ---------- Query options (ORM-Agnostic) ---------- */
export interface BaseOptions<T = unknown> {
  transaction?: T;
  user?: IAuthUser;
}

export interface QueryOptions<T = unknown> extends BaseOptions<T> {
  softDelete?: boolean;
}

export interface FindQuery<
  E extends object = any,
  TContext = unknown,
> extends QueryOptions<TContext> {
  select?: Partial<Record<Paths<E>, 1 | 0>>;
  filters?: FilterRule<E>[];
  population?: PopulationQuery<E>[];
  page?: number;
  limit?: number;
  offset?: number;
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
