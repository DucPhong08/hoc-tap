import { Injectable } from '@nestjs/common';
import type { EntityManager, TransactionOptions } from '@mikro-orm/core';
import type {
  QueryCondition,
  PaginationResult,
  UpdateData,
  FindQuery,
  QueryOptions,
} from '@/common/interfaces/repository.interface';
import type { IBaseRepository } from '@/common/interfaces/repository.interface';
import { BaseEntity } from '@/common/entity/base.entity';
import { BaseTransaction } from '../transaction/base-transaction.interface';
import type { IAuthUser } from '@/common/interfaces/auth-user.interface';

export interface BaseServiceConfig<TContext = EntityManager> {
  notFoundMessage?: string;
  transaction?: BaseTransaction<TContext>;
}

@Injectable()
export abstract class BaseService<
  E extends BaseEntity,
  TContext = EntityManager,
  TCreate = Partial<E>,
  TUpdate = UpdateData<E>,
  TCondition = QueryCondition<E>,
> {
  public readonly notFoundMessage?: string;
  protected readonly transaction?: BaseTransaction<TContext>;

  constructor(
    protected readonly repository: IBaseRepository<E, TContext>,
    config?: BaseServiceConfig<TContext>,
  ) {
    this.notFoundMessage = config?.notFoundMessage ?? 'Không tìm thấy dữ liệu';
    this.transaction = config?.transaction;
  }

  async create(
    user: IAuthUser,
    dto: TCreate,
    query?: FindQuery<E, TContext>,
  ): Promise<E> {
    return this.executeWithTransaction(query, (txOptions) =>
      this.repository.create(dto as Partial<E>, txOptions),
    );
  }

  async insertMany(
    user: IAuthUser,
    dtos: TCreate[],
    query?: FindQuery<E, TContext>,
  ): Promise<{ n: number }> {
    return this.executeWithTransaction(query, (txOptions) =>
      this.repository.insertMany(dtos as Partial<E>[], txOptions),
    );
  }

  async getById(
    user: IAuthUser,
    id: string,
    query?: FindQuery<E, TContext>,
  ): Promise<E | null> {
    return this.repository.getById(id, query);
  }

  async getOne(
    user: IAuthUser,
    condition: TCondition,
    query?: FindQuery<E, TContext>,
  ): Promise<E | null> {
    return this.repository.getOne(condition as QueryCondition<E>, query);
  }

  async getMany(
    user: IAuthUser,
    condition?: TCondition,
    query?: FindQuery<E, TContext>,
  ): Promise<E[]> {
    return this.repository.getMany(condition as QueryCondition<E>, query);
  }

  async getPage(
    user: IAuthUser,
    condition?: TCondition,
    query?: FindQuery<E, TContext>,
  ): Promise<PaginationResult<E>> {
    return this.repository.getPage(condition as QueryCondition<E>, query);
  }

  async updateById(
    user: IAuthUser,
    id: string,
    update: TUpdate,
    query?: FindQuery<E, TContext>,
  ): Promise<E | null> {
    return this.executeWithTransaction(query, async (txOptions) => {
      return this.repository.updateById(id, update as UpdateData<E>, txOptions);
    });
  }

  async updateOne(
    user: IAuthUser,
    condition: TCondition,
    update: TUpdate,
    query?: FindQuery<E, TContext>,
  ): Promise<E | null> {
    return this.executeWithTransaction(query, async (txOptions) => {
      return this.repository.updateOne(
        condition as QueryCondition<E>,
        update as UpdateData<E>,
        txOptions,
      );
    });
  }

  async updateMany(
    user: IAuthUser,
    condition: TCondition,
    update: TUpdate,
    query?: FindQuery<E, TContext>,
  ): Promise<{ affected: number }> {
    return this.executeWithTransaction(query, (txOptions) =>
      this.repository.updateMany(
        condition as QueryCondition<E>,
        update as UpdateData<E>,
        txOptions,
      ),
    );
  }

  async updateManyByIds(
    user: IAuthUser,
    ids: string[],
    update: TUpdate,
    query?: FindQuery<E, TContext>,
  ): Promise<{ affected: number }> {
    return this.updateMany(
      user,
      { id: { $in: ids } } as unknown as TCondition,
      update,
      query,
    );
  }

  async deleteById(
    user: IAuthUser,
    id: string,
    query?: FindQuery<E, TContext>,
  ): Promise<E | null> {
    return this.executeWithTransaction(query, async (txOptions) => {
      return this.repository.deleteById(id, txOptions);
    });
  }

  async deleteOne(
    user: IAuthUser,
    condition: TCondition,
    query?: FindQuery<E, TContext>,
  ): Promise<E | null> {
    return this.executeWithTransaction(query, async (txOptions) => {
      return this.repository.deleteOne(
        condition as QueryCondition<E>,
        txOptions,
      );
    });
  }

  async deleteMany(
    user: IAuthUser,
    condition: TCondition,
    query?: FindQuery<E, TContext>,
  ): Promise<{ deleted: number }> {
    return this.executeWithTransaction(query, (txOptions) =>
      this.repository.deleteMany(condition as QueryCondition<E>, txOptions),
    );
  }

  async deleteManyByIds(
    user: IAuthUser,
    ids: string[],
    query?: FindQuery<E, TContext>,
  ): Promise<{ deleted: number }> {
    return this.deleteMany(
      user,
      { id: { $in: ids } } as unknown as TCondition,
      query,
    );
  }

  async count(
    user: IAuthUser,
    condition?: TCondition,
    query?: QueryOptions<TContext>,
  ): Promise<number> {
    return this.repository.count(condition as QueryCondition<E>, query);
  }

  async exists(
    user: IAuthUser,
    condition: TCondition,
    query?: QueryOptions<TContext>,
  ): Promise<boolean> {
    return this.repository.exists(condition as QueryCondition<E>, query);
  }

  protected async executeWithTransaction<
    TResult,
    TOptions extends { transaction?: TContext },
  >(
    options: TOptions | undefined,
    callback: (txOptions: TOptions) => Promise<TResult>,
    transactionOptions?: TransactionOptions,
  ): Promise<TResult> {
    const txOptions = { ...(options ?? {}) } as TOptions;

    if (txOptions.transaction || !this.transaction) {
      return callback(txOptions);
    }

    return this.transaction.execute(
      async (transaction) =>
        callback({
          ...txOptions,
          transaction,
        } as TOptions),
      transactionOptions,
    );
  }
}
