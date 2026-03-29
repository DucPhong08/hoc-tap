import { BaseEntity } from '../entity/base.entity';
import type {
  QueryCondition,
  FindQuery,
  CreateCommand,
  UpdateCommand,
  DeleteCommand,
  PaginationResult,
  BulkWriteResult,
  BulkDeleteResult,
  UpdateData,
  QueryOptions,
  CommandOptions,
} from '../types/repository.types';

export type {
  QueryCondition,
  FindQuery,
  CreateCommand,
  UpdateCommand,
  DeleteCommand,
  PaginationResult,
  BulkWriteResult,
  BulkDeleteResult,
  UpdateData,
  QueryOptions,
  CommandOptions,
};

export interface IBaseRepository<E extends BaseEntity, TContext = unknown> {
  create(
    data: Partial<E>,
    options?: CreateCommand & CommandOptions<TContext>,
  ): Promise<E>;

  insertMany(
    data: Partial<E>[],
    options?: CommandOptions<TContext>,
  ): Promise<{ n: number }>;

  getById(
    id: string,
    options?: FindQuery<E> & QueryOptions<TContext>,
  ): Promise<E | null>;

  getOne(
    condition: QueryCondition<E>,
    options?: FindQuery<E> & QueryOptions<TContext>,
  ): Promise<E | null>;

  getMany(
    condition: QueryCondition<E>,
    options?: FindQuery<E> & QueryOptions<TContext>,
  ): Promise<E[]>;

  getPage(
    condition: QueryCondition<E>,
    options: FindQuery<E> &
      QueryOptions<TContext> & { page: number; limit: number },
  ): Promise<PaginationResult<E>>;

  updateById(
    id: string,
    data: UpdateData<E>,
    options?: UpdateCommand & CommandOptions<TContext>,
  ): Promise<E | null>;

  updateOne(
    condition: QueryCondition<E>,
    data: UpdateData<E>,
    options?: UpdateCommand & CommandOptions<TContext>,
  ): Promise<E | null>;

  updateMany(
    condition: QueryCondition<E>,
    data: UpdateData<E>,
    options?: UpdateCommand & CommandOptions<TContext>,
  ): Promise<BulkWriteResult>;

  deleteById(
    id: string,
    options?: DeleteCommand & CommandOptions<TContext>,
  ): Promise<E | null>;

  deleteOne(
    condition: QueryCondition<E>,
    options?: DeleteCommand & CommandOptions<TContext>,
  ): Promise<E | null>;

  deleteMany(
    condition: QueryCondition<E>,
    options?: DeleteCommand & CommandOptions<TContext>,
  ): Promise<BulkDeleteResult>;

  count(
    condition?: QueryCondition<E>,
    options?: QueryOptions<TContext>,
  ): Promise<number>;

  exists(
    condition: QueryCondition<E>,
    options?: QueryOptions<TContext>,
  ): Promise<boolean>;

  distinct<K extends keyof E>(
    field: K,
    condition?: QueryCondition<E>,
    options?: QueryOptions<TContext>,
  ): Promise<E[K][]>;

  restore(id: string, options?: CommandOptions<TContext>): Promise<E | null>;
}
