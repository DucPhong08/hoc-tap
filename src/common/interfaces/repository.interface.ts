import { BaseEntity } from '../entity/base.entity';
import type {
  QueryCondition,
  FindQuery,
  PaginationResult,
  BulkWriteResult,
  BulkDeleteResult,
  UpdateData,
  QueryOptions,
  BaseOptions,
} from '../types/repository.types';

export type {
  QueryCondition,
  FindQuery,
  PaginationResult,
  BulkWriteResult,
  BulkDeleteResult,
  UpdateData,
  QueryOptions,
  BaseOptions,
};

export interface IBaseRepository<E extends BaseEntity, TContext = unknown> {
  create(data: Partial<E>, query?: FindQuery<E, TContext>): Promise<E>;

  insertMany(
    data: Partial<E>[],
    query?: FindQuery<E, TContext>,
  ): Promise<{ n: number }>;

  getById(id: string, query?: FindQuery<E, TContext>): Promise<E | null>;

  getOne(
    condition: QueryCondition<E>,
    query?: FindQuery<E, TContext>,
  ): Promise<E | null>;

  getMany(
    condition: QueryCondition<E>,
    query?: FindQuery<E, TContext>,
  ): Promise<E[]>;

  getPage(
    condition: QueryCondition<E>,
    query?: FindQuery<E, TContext>,
  ): Promise<PaginationResult<E>>;

  updateById(
    id: string,
    data: UpdateData<E>,
    query?: FindQuery<E, TContext>,
  ): Promise<E | null>;

  updateOne(
    condition: QueryCondition<E>,
    data: UpdateData<E>,
    query?: FindQuery<E, TContext>,
  ): Promise<E | null>;

  updateMany(
    condition: QueryCondition<E>,
    data: UpdateData<E>,
    query?: FindQuery<E, TContext>,
  ): Promise<BulkWriteResult>;

  deleteById(id: string, query?: FindQuery<E, TContext>): Promise<E | null>;

  deleteOne(
    condition: QueryCondition<E>,
    query?: FindQuery<E, TContext>,
  ): Promise<E | null>;

  deleteMany(
    condition: QueryCondition<E>,
    query?: FindQuery<E, TContext>,
  ): Promise<BulkDeleteResult>;

  count(
    condition?: QueryCondition<E>,
    query?: QueryOptions<TContext>,
  ): Promise<number>;

  exists(
    condition: QueryCondition<E>,
    query?: QueryOptions<TContext>,
  ): Promise<boolean>;

  distinct<K extends keyof E>(
    field: K,
    condition?: QueryCondition<E>,
    query?: QueryOptions<TContext>,
  ): Promise<E[K][]>;

  restore(id: string, query?: FindQuery<E, TContext>): Promise<E | null>;
}
