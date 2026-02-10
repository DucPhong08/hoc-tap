import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  QueryCondition,
  PaginationResult,
  UpdateData,
  GetByIdQuery,
  GetOneQuery,
  GetManyQuery,
  GetPageQuery,
  CreateQuery,
  UpdateByIdQuery,
  UpdateOneQuery,
  UpdateManyQuery,
  DeleteByIdQuery,
  DeleteOneQuery,
  DeleteManyQuery,
  BaseQueryOption,
  BaseCommandOption,
} from '../../common/interfaces/repository.interface';
import type { IBaseRepository } from '../../common/interfaces/repository.interface';
import { BaseEntity } from '../../common/entity/base.entity';
import type { BaseTransaction } from '../transaction/base-transaction.interface';
import type { UserContext } from '../../common/types/user.type';

export interface BaseCrudServiceConfig<TContext = unknown> {
  notFoundMessage?: string;
  transaction?: BaseTransaction<TContext>;
}

@Injectable()
export abstract class BaseCrudService<
  E extends BaseEntity,
  TContext = unknown,
> {
  protected readonly notFoundMessage: string;
  protected readonly transaction?: BaseTransaction<TContext>;

  constructor(
    protected readonly repository: IBaseRepository<E, TContext>,
    config?: BaseCrudServiceConfig<TContext>,
  ) {
    this.notFoundMessage = config?.notFoundMessage ?? 'Không tìm thấy bản ghi';
    this.transaction = config?.transaction;
  }

  async create(
    user: UserContext,
    dto: Partial<E>,
    query?: CreateQuery & BaseCommandOption<TContext>,
  ): Promise<E> {
    return this.executeWithTransaction(query, async (txQuery) => {
      return this.repository.create(dto, txQuery);
    });
  }

  async insertMany(
    user: UserContext,
    list: Partial<E>[],
    query?: BaseCommandOption<TContext>,
  ): Promise<{ n: number }> {
    return this.executeWithTransaction(query, async (txQuery) => {
      return this.repository.insertMany(list, txQuery);
    });
  }

  async getById(
    user: UserContext,
    id: string,
    query?: GetByIdQuery<E> & BaseQueryOption<TContext>,
  ): Promise<E> {
    const entity = await this.repository.getById(id, query);

    if (!entity) {
      throw new NotFoundException(`${this.notFoundMessage} với ID: ${id}`);
    }

    return entity;
  }

  async getByIdOrNull(
    user: UserContext,
    id: string,
    query?: GetByIdQuery<E> & BaseQueryOption<TContext>,
  ): Promise<E | null> {
    return this.repository.getById(id, query);
  }

  async getOne(
    user: UserContext,
    condition: QueryCondition<E>,
    query?: GetOneQuery<E> & BaseQueryOption<TContext>,
  ): Promise<E> {
    const entity = await this.repository.getOne(condition, query);

    if (!entity) {
      throw new NotFoundException(this.notFoundMessage);
    }

    return entity;
  }

  async getOneOrNull(
    user: UserContext,
    condition: QueryCondition<E>,
    query?: GetOneQuery<E> & BaseQueryOption<TContext>,
  ): Promise<E | null> {
    return this.repository.getOne(condition, query);
  }

  async getMany(
    user: UserContext,
    condition: QueryCondition<E>,
    query?: GetManyQuery<E> & BaseQueryOption<TContext>,
  ): Promise<E[]> {
    return this.repository.getMany(condition, query);
  }

  async getPage(
    user: UserContext,
    condition: QueryCondition<E>,
    query: GetPageQuery<E> & BaseQueryOption<TContext>,
  ): Promise<PaginationResult<E>> {
    return this.repository.getPage(condition, query);
  }

  async updateById(
    user: UserContext,
    id: string,
    update: UpdateData<E>,
    query?: UpdateByIdQuery & BaseCommandOption<TContext>,
  ): Promise<E> {
    return this.executeWithTransaction(query, async (txQuery) => {
      const entity = await this.repository.updateById(id, update, txQuery);

      if (!entity) {
        throw new NotFoundException(`${this.notFoundMessage} với ID: ${id}`);
      }

      return entity;
    });
  }

  async updateOne(
    user: UserContext,
    condition: QueryCondition<E>,
    update: UpdateData<E>,
    query?: UpdateOneQuery & BaseCommandOption<TContext>,
  ): Promise<E> {
    return this.executeWithTransaction(query, async (txQuery) => {
      const entity = await this.repository.updateOne(
        condition,
        update,
        txQuery,
      );

      if (!entity) {
        throw new NotFoundException(this.notFoundMessage);
      }

      return entity;
    });
  }

  async updateMany(
    user: UserContext,
    condition: QueryCondition<E>,
    update: UpdateData<E>,
    query?: UpdateManyQuery & BaseCommandOption<TContext>,
  ): Promise<{ affected: number }> {
    return this.executeWithTransaction(query, async (txQuery) => {
      return this.repository.updateMany(condition, update, txQuery);
    });
  }

  async updateManyByIds(
    user: UserContext,
    ids: string[],
    update: UpdateData<E>,
    query?: UpdateManyQuery & BaseCommandOption<TContext>,
  ): Promise<{ affected: number }> {
    return this.updateMany(
      user,
      { _id: { $in: ids } } as QueryCondition<E>,
      update,
      query,
    );
  }

  async deleteById(
    user: UserContext,
    id: string,
    query?: DeleteByIdQuery & BaseCommandOption<TContext>,
  ): Promise<E> {
    return this.executeWithTransaction(query, async (txQuery) => {
      const entity = await this.repository.deleteById(id, txQuery);

      if (!entity) {
        throw new NotFoundException(`${this.notFoundMessage} với ID: ${id}`);
      }

      return entity;
    });
  }

  async deleteOne(
    user: UserContext,
    condition: QueryCondition<E>,
    query?: DeleteOneQuery & BaseCommandOption<TContext>,
  ): Promise<E> {
    return this.executeWithTransaction(query, async (txQuery) => {
      const entity = await this.repository.deleteOne(condition, txQuery);

      if (!entity) {
        throw new NotFoundException(this.notFoundMessage);
      }

      return entity;
    });
  }

  async deleteMany(
    user: UserContext,
    condition: QueryCondition<E>,
    query?: DeleteManyQuery & BaseCommandOption<TContext>,
  ): Promise<{ deleted: number }> {
    return this.executeWithTransaction(query, async (txQuery) => {
      return this.repository.deleteMany(condition, txQuery);
    });
  }

  async deleteManyByIds(
    user: UserContext,
    ids: string[],
    query?: DeleteManyQuery & BaseCommandOption<TContext>,
  ): Promise<{ deleted: number }> {
    return this.deleteMany(
      user,
      { _id: { $in: ids } } as QueryCondition<E>,
      query,
    );
  }

  async count(
    user: UserContext,
    condition?: QueryCondition<E>,
    query?: BaseQueryOption<TContext>,
  ): Promise<number> {
    return this.repository.count(condition, query);
  }

  async exists(
    user: UserContext,
    condition: QueryCondition<E>,
    query?: BaseQueryOption<TContext>,
  ): Promise<boolean> {
    return this.repository.exists(condition, query);
  }

  protected async executeWithTransaction<T>(
    query: BaseCommandOption<TContext> | undefined,
    callback: (txQuery: BaseCommandOption<TContext>) => Promise<T>,
  ): Promise<T> {
    const hasExternalTransaction = Boolean(query?.transaction);
    const txQuery = query || {};

    if (!hasExternalTransaction && this.transaction) {
      txQuery.transaction = await this.transaction.startTransaction();
    }

    try {
      const result = await callback(txQuery);

      if (!hasExternalTransaction && this.transaction && txQuery.transaction) {
        await this.transaction.commitTransaction(txQuery.transaction);
      }

      return result;
    } catch (error) {
      if (!hasExternalTransaction && this.transaction && txQuery.transaction) {
        await this.transaction.abortTransaction(txQuery.transaction);
      }
      throw error;
    }
  }
}
