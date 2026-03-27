import { BaseEntity } from '../entity/base.entity';
import type {
  QueryCondition,
  GetByIdQuery,
  GetOneQuery,
  GetManyQuery,
  GetPageQuery,
  CountQuery,
  ExistsQuery,
  CreateCommand,
  InsertManyCommand,
  UpdateByIdCommand,
  UpdateOneCommand,
  UpdateManyCommand,
  DeleteByIdCommand,
  DeleteOneCommand,
  DeleteManyCommand,
  PaginationResult,
  UpdateManyResult,
  DeleteManyResult,
  UpdateData,
  BaseQueryOption,
  BaseCommandOption,
} from './query';

export type {
  QueryCondition,
  GetByIdQuery,
  GetOneQuery,
  GetManyQuery,
  GetPageQuery,
  CountQuery,
  ExistsQuery,
  CreateCommand,
  InsertManyCommand,
  UpdateByIdCommand,
  UpdateOneCommand,
  UpdateManyCommand,
  DeleteByIdCommand,
  DeleteOneCommand,
  DeleteManyCommand,
  PaginationResult,
  UpdateManyResult,
  DeleteManyResult,
  UpdateData,
  BaseQueryOption,
  BaseCommandOption,
};

export interface IBaseRepository<E extends BaseEntity, TContext = unknown> {
  create(
    data: Partial<E>,
    command?: CreateCommand & BaseCommandOption<TContext>,
  ): Promise<E>;

  insertMany(
    data: Partial<E>[],
    command?: InsertManyCommand & BaseCommandOption<TContext>,
  ): Promise<{ n: number }>;

  getById(
    id: string,
    query?: GetByIdQuery<E> & BaseQueryOption<TContext>,
  ): Promise<E | null>;

  getOne(
    condition: QueryCondition<E>,
    query?: GetOneQuery<E> & BaseQueryOption<TContext>,
  ): Promise<E | null>;

  getMany(
    condition: QueryCondition<E>,
    query?: GetManyQuery<E> & BaseQueryOption<TContext>,
  ): Promise<E[]>;

  getPage(
    condition: QueryCondition<E>,
    query: GetPageQuery<E> & BaseQueryOption<TContext>,
  ): Promise<PaginationResult<E>>;

  updateById(
    id: string,
    data: UpdateData<E>,
    command?: UpdateByIdCommand & BaseCommandOption<TContext>,
  ): Promise<E | null>;

  updateOne(
    condition: QueryCondition<E>,
    data: UpdateData<E>,
    command?: UpdateOneCommand & BaseCommandOption<TContext>,
  ): Promise<E | null>;

  updateMany(
    condition: QueryCondition<E>,
    data: UpdateData<E>,
    command?: UpdateManyCommand & BaseCommandOption<TContext>,
  ): Promise<UpdateManyResult>;

  deleteById(
    id: string,
    command?: DeleteByIdCommand & BaseCommandOption<TContext>,
  ): Promise<E | null>;

  deleteOne(
    condition: QueryCondition<E>,
    command?: DeleteOneCommand & BaseCommandOption<TContext>,
  ): Promise<E | null>;

  deleteMany(
    condition: QueryCondition<E>,
    command?: DeleteManyCommand & BaseCommandOption<TContext>,
  ): Promise<DeleteManyResult>;

  count(
    condition?: QueryCondition<E>,
    query?: CountQuery & BaseQueryOption<TContext>,
  ): Promise<number>;

  exists(
    condition: QueryCondition<E>,
    query?: ExistsQuery & BaseQueryOption<TContext>,
  ): Promise<boolean>;

  distinct<K extends keyof E>(
    field: K,
    condition?: QueryCondition<E>,
    query?: BaseQueryOption<TContext>,
  ): Promise<E[K][]>;

  restore(id: string, command?: BaseCommandOption<TContext>): Promise<E | null>;
}
