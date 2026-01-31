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

export interface IBaseRepository<E extends BaseEntity, T = unknown> {
  create(
    document: Partial<E>,
    query?: CreateQuery<E> & BaseCommandOption<T>,
  ): Promise<E>;

  insertMany(
    documents: Partial<E>[],
    query?: InsertManyQuery<E> & BaseCommandOption<T>,
  ): Promise<{ n: number }>;

  // ============= GET =============

  getById(
    id: string,
    query?: GetByIdQuery<E> & BaseQueryOption<T>,
  ): Promise<E | null>;

  getOne(
    condition: QueryCondition<E>,
    query?: GetOneQuery<E> & BaseQueryOption<T>,
  ): Promise<E | null>;

  getMany(
    condition: QueryCondition<E>,
    query?: GetManyQuery<E> & BaseQueryOption<T>,
  ): Promise<E[]>;

  getPage(
    condition: QueryCondition<E>,
    query: GetPageQuery<E> & BaseQueryOption<T>,
  ): Promise<PaginationResult<E>>;

  // ============= UPDATE =============

  updateById(
    id: string,
    data: UpdateData<E>,
    query?: UpdateByIdQuery<E> & BaseCommandOption<T>,
  ): Promise<E | null>;

  updateOne(
    condition: QueryCondition<E>,
    data: UpdateData<E>,
    query?: UpdateOneQuery<E> & BaseCommandOption<T>,
  ): Promise<E | null>;

  updateMany(
    condition: QueryCondition<E>,
    data: UpdateData<E>,
    query?: UpdateManyQuery<E> & BaseCommandOption<T>,
  ): Promise<UpdateManyResult>;

  // ============= DELETE =============

  deleteById(
    id: string,
    query?: DeleteByIdQuery<E> & BaseCommandOption<T>,
  ): Promise<E | null>;

  deleteOne(
    condition: QueryCondition<E>,
    query?: DeleteOneQuery<E> & BaseCommandOption<T>,
  ): Promise<E | null>;

  deleteMany(
    condition: QueryCondition<E>,
    query?: DeleteManyQuery<E> & BaseCommandOption<T>,
  ): Promise<DeleteManyResult>;

  count(
    condition?: QueryCondition<E>,
    query?: CountQuery<E> & BaseQueryOption<T>,
  ): Promise<number>;

  exists(
    condition: QueryCondition<E>,
    query?: ExistsQuery<E> & BaseQueryOption<T>,
  ): Promise<boolean>;

  restore(id: string, query?: BaseCommandOption<T>): Promise<E | null>;
}
