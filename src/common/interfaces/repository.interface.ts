import { BaseEntity } from '../entity/base.entity';
import type {
  QueryCondition,
  GetByIdQuery,
  GetOneQuery,
  GetManyQuery,
  GetPageQuery,
  CountQuery,
  ExistsQuery,
  CreateQuery,
  InsertManyQuery,
  UpdateByIdQuery,
  UpdateOneQuery,
  UpdateManyQuery,
  DeleteByIdQuery,
  DeleteOneQuery,
  DeleteManyQuery,
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
  CreateQuery,
  InsertManyQuery,
  UpdateByIdQuery,
  UpdateOneQuery,
  UpdateManyQuery,
  DeleteByIdQuery,
  DeleteOneQuery,
  DeleteManyQuery,
  PaginationResult,
  UpdateManyResult,
  DeleteManyResult,
  UpdateData,
  BaseQueryOption,
  BaseCommandOption,
};

export interface IBaseRepository<E extends BaseEntity, TContext = unknown> {
  create(
    document: Partial<E>,
    query?: CreateQuery & BaseCommandOption<TContext>,
  ): Promise<E>;

  insertMany(
    documents: Partial<E>[],
    query?: InsertManyQuery & BaseCommandOption<TContext>,
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
    query?: UpdateByIdQuery & BaseCommandOption<TContext>,
  ): Promise<E | null>;

  updateOne(
    condition: QueryCondition<E>,
    data: UpdateData<E>,
    query?: UpdateOneQuery & BaseCommandOption<TContext>,
  ): Promise<E | null>;

  updateMany(
    condition: QueryCondition<E>,
    data: UpdateData<E>,
    query?: UpdateManyQuery & BaseCommandOption<TContext>,
  ): Promise<UpdateManyResult>;

  deleteById(
    id: string,
    query?: DeleteByIdQuery & BaseCommandOption<TContext>,
  ): Promise<E | null>;

  deleteOne(
    condition: QueryCondition<E>,
    query?: DeleteOneQuery & BaseCommandOption<TContext>,
  ): Promise<E | null>;

  deleteMany(
    condition: QueryCondition<E>,
    query?: DeleteManyQuery & BaseCommandOption<TContext>,
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

  restore(id: string, query?: BaseCommandOption<TContext>): Promise<E | null>;
}
