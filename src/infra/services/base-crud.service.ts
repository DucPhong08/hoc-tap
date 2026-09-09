import { Injectable } from '@nestjs/common';
import type { TransactionOptions } from '@mikro-orm/core';
import type {
  QueryCondition,
  PaginationResult,
  UpdateData,
  FindQuery,
  QueryOptions,
} from '@/common/interfaces/repository.interface';
import type { IBaseRepository } from '@/common/interfaces/repository.interface';
import { BaseEntity } from '@/common/entity/base.entity';
import type { BaseCrudServiceConfig } from './base-crud.constant';
import { BaseTransaction } from '../transaction/base-transaction.interface';
import type { IAuthUser } from '@/common/interfaces/auth-user.interface';

@Injectable()
export abstract class BaseCrudService<
  E extends BaseEntity,
  TContext = unknown,
> {
  public readonly notFoundMessage?: string;
  protected readonly transaction?: BaseTransaction<TContext>;

  constructor(
    protected readonly repository: IBaseRepository<E, TContext>,
    config?: BaseCrudServiceConfig<TContext>,
  ) {
    this.notFoundMessage = config?.notFoundMessage;
    this.transaction = config?.transaction;
  }

  async create(
    user: IAuthUser,
    dto: Partial<E>,
    query?: FindQuery<E, TContext>,
  ): Promise<E> {
    return this.executeWithTransaction(query, (tx) =>
      this.repository.create(dto, tx),
    );
  }

  async insertMany(
    user: IAuthUser,
    dtos: Partial<E>[],
    query?: FindQuery<E, TContext>,
  ): Promise<{ n: number }> {
    return this.executeWithTransaction(query, (tx) =>
      this.repository.insertMany(dtos, tx),
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
    condition: QueryCondition<E>,
    query?: FindQuery<E, TContext>,
  ): Promise<E | null> {
    return this.repository.getOne(condition, query);
  }

  async getMany(
    user: IAuthUser,
    condition: QueryCondition<E>,
    query?: FindQuery<E, TContext>,
  ): Promise<E[]> {
    return this.repository.getMany(condition, query);
  }

  async getPage(
    user: IAuthUser,
    condition: QueryCondition<E>,
    query?: FindQuery<E, TContext>,
  ): Promise<PaginationResult<E>> {
    return this.repository.getPage(condition, query);
  }

  async updateById(
    user: IAuthUser,
    id: string,
    update: UpdateData<E>,
    query?: FindQuery<E, TContext>,
  ): Promise<E | null> {
    return this.executeWithTransaction(query, async (tx) => {
      return this.repository.updateById(id, update, tx);
    });
  }

  async updateOne(
    user: IAuthUser,
    condition: QueryCondition<E>,
    update: UpdateData<E>,
    query?: FindQuery<E, TContext>,
  ): Promise<E | null> {
    return this.executeWithTransaction(query, async (tx) => {
      return this.repository.updateOne(condition, update, tx);
    });
  }

  async updateMany(
    user: IAuthUser,
    condition: QueryCondition<E>,
    update: UpdateData<E>,
    query?: FindQuery<E, TContext>,
  ): Promise<{ affected: number }> {
    return this.executeWithTransaction(query, (tx) =>
      this.repository.updateMany(condition, update, tx),
    );
  }

  async updateManyByIds(
    user: IAuthUser,
    ids: string[],
    update: UpdateData<E>,
    query?: FindQuery<E, TContext>,
  ): Promise<{ affected: number }> {
    return this.updateMany(user, { id: { $in: ids } } as any, update, query);
  }

  async deleteById(
    user: IAuthUser,
    id: string,
    query?: FindQuery<E, TContext>,
  ): Promise<E | null> {
    return this.executeWithTransaction(query, async (tx) => {
      return this.repository.deleteById(id, tx);
    });
  }

  async deleteOne(
    user: IAuthUser,
    condition: QueryCondition<E>,
    query?: FindQuery<E, TContext>,
  ): Promise<E | null> {
    return this.executeWithTransaction(query, async (tx) => {
      return this.repository.deleteOne(condition, tx);
    });
  }

  async deleteMany(
    user: IAuthUser,
    condition: QueryCondition<E>,
    query?: FindQuery<E, TContext>,
  ): Promise<{ deleted: number }> {
    return this.executeWithTransaction(query, (tx) =>
      this.repository.deleteMany(condition, tx),
    );
  }

  async deleteManyByIds(
    user: IAuthUser,
    ids: string[],
    query?: FindQuery<E, TContext>,
  ): Promise<{ deleted: number }> {
    return this.deleteMany(user, { id: { $in: ids } } as any, query);
  }

  async count(
    user: IAuthUser,
    condition?: QueryCondition<E>,
    query?: QueryOptions<TContext>,
  ): Promise<number> {
    return this.repository.count(condition, query);
  }

  async exists(
    user: IAuthUser,
    condition: QueryCondition<E>,
    query?: QueryOptions<TContext>,
  ): Promise<boolean> {
    return this.repository.exists(condition, query);
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
