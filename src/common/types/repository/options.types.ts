import type {
  FindOptions as MikroFindOptions,
  NativeInsertUpdateOptions as MikroNativeInsertUpdateOptions,
} from '@mikro-orm/core';
import type { Paths } from './util.types';
import type { PopulationQuery } from './populate.types';
import { FilterRule } from './filter.types';

export interface BaseOptions<T = unknown> {
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
  softDelete?: boolean;
}

export interface CommandOptions<T = unknown, E extends object = any>
  extends BaseOptions<T>, Omit<MikroNativeInsertUpdateOptions<E>, 'ctx'> {
  population?: PopulationQuery<E>[];
  /** Buộc nạp lại từ DB và làm mới dữ liệu trong bộ nhớ RAM của ORM */
  refresh?: boolean;
}

export interface FindQuery<
  E extends object = any,
  TContext = unknown,
> extends QueryOptions<TContext, E> {
  select?: Partial<Record<Paths<E>, 1 | 0>>;
  filters?: FilterRule<E>[];
  population?: PopulationQuery<E>[];
  sort?: Partial<Record<Paths<E>, 1 | -1>>;
  limit?: number;
  offset?: number;
  refresh?: boolean;
}

export interface DeleteCommand {
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
