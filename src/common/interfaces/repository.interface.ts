import { BaseEntity } from '../entity/base.entity';
import type {
  QueryCondition,
  FindQuery,
  DeleteCommand,
  PaginationResult,
  BulkWriteResult,
  BulkDeleteResult,
  UpdateData,
  QueryOptions,
  CommandOptions,
  BaseOptions,
} from '../types/repository.types';

export type {
  QueryCondition,
  FindQuery,
  DeleteCommand,
  PaginationResult,
  BulkWriteResult,
  BulkDeleteResult,
  UpdateData,
  QueryOptions,
  CommandOptions,
  BaseOptions,
};

export interface IBaseRepository<E extends BaseEntity, TContext = unknown> {
  create(data: Partial<E>, options?: CommandOptions<TContext, E>): Promise<E>;

  insertMany(
    data: Partial<E>[],
    options?: CommandOptions<TContext, E>,
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
    query?: FindQuery<E, TContext> & { page?: number; limit?: number },
  ): Promise<PaginationResult<E>>;

  updateById(
    id: string,
    data: UpdateData<E>,
    options?: CommandOptions<TContext, E>,
  ): Promise<E | null>;

  updateOne(
    condition: QueryCondition<E>,
    data: UpdateData<E>,
    options?: CommandOptions<TContext, E>,
  ): Promise<E | null>;

  updateMany(
    condition: QueryCondition<E>,
    data: UpdateData<E>,
    options?: CommandOptions<TContext, E>,
  ): Promise<BulkWriteResult>;

  deleteById(
    id: string,
    options?: DeleteCommand & CommandOptions<TContext, E>,
  ): Promise<E | null>;

  deleteOne(
    condition: QueryCondition<E>,
    options?: DeleteCommand & CommandOptions<TContext, E>,
  ): Promise<E | null>;

  deleteMany(
    condition: QueryCondition<E>,
    options?: DeleteCommand & CommandOptions<TContext, E>,
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

  restore(id: string, options?: CommandOptions<TContext, E>): Promise<E | null>;

  keys<K extends keyof E>(...names: K[]): K[];
}
