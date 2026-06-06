import { Injectable, NotFoundException } from '@nestjs/common';
import type { TransactionOptions } from '@mikro-orm/core';
import type {
  QueryCondition,
  PaginationResult,
  UpdateData,
  FindQuery,
  DeleteCommand,
  QueryOptions,
  CommandOptions,
} from '../../common/interfaces/repository.interface';
import type { IBaseRepository } from '../../common/interfaces/repository.interface';
import { BaseEntity } from '../../common/entity/base.entity';
import type { BaseCrudServiceConfig } from './base-crud.constant';
import { BaseTransaction } from '../transaction/base-transaction.interface';
import type { User } from '../../modules/users/entities/user.entity';

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
    user: User | null,
    dto: Partial<E>,
    query?: CommandOptions<TContext, E>,
  ): Promise<E> {
    return this.executeWithTransaction(query, (tx) =>
      this.repository.create(dto, tx),
    );
  }

  async insertMany(
    user: User | null,
    dtos: Partial<E>[],
    query?: CommandOptions<TContext, E>,
  ): Promise<{ n: number }> {
    return this.executeWithTransaction(query, (tx) =>
      this.repository.insertMany(dtos, tx),
    );
  }

  async getById(
    user: User | null,
    id: string,
    query?: FindQuery<E, TContext>,
  ): Promise<E> {
    const entity = await this.repository.getById(id, query);
    if (!entity) {
      throw new NotFoundException(`${this.notFoundMessage} với ID: ${id}`);
    }
    return entity;
  }

  async getByIdOrNull(
    user: User | null,
    id: string,
    query?: FindQuery<E, TContext>,
  ): Promise<E | null> {
    return this.repository.getById(id, query);
  }

  async getOne(
    user: User | null,
    condition: QueryCondition<E>,
    query?: FindQuery<E, TContext>,
  ): Promise<E> {
    const entity = await this.repository.getOne(condition, query);
    if (!entity) {
      throw new NotFoundException(this.notFoundMessage);
    }
    return entity;
  }

  async getMany(
    user: User | null,
    condition: QueryCondition<E>,
    query?: FindQuery<E, TContext>,
  ): Promise<E[]> {
    return this.repository.getMany(condition, query);
  }

  async getPage(
    user: User | null,
    condition: QueryCondition<E>,
    query: FindQuery<E, TContext> & { page: number; limit: number },
  ): Promise<PaginationResult<E>> {
    return this.repository.getPage(condition, query);
  }

  async updateById(
    user: User | null,
    id: string,
    update: UpdateData<E>,
    query?: CommandOptions<TContext, E>,
  ): Promise<E> {
    return this.executeWithTransaction(query, async (tx) => {
      const entity = await this.repository.updateById(id, update, tx);
      if (!entity) {
        throw new NotFoundException(`${this.notFoundMessage} với ID: ${id}`);
      }
      return entity;
    });
  }

  async updateOne(
    user: User | null,
    condition: QueryCondition<E>,
    update: UpdateData<E>,
    query?: CommandOptions<TContext, E>,
  ): Promise<E> {
    return this.executeWithTransaction(query, async (tx) => {
      const entity = await this.repository.updateOne(condition, update, tx);
      if (!entity) {
        throw new NotFoundException(this.notFoundMessage);
      }
      return entity;
    });
  }

  async updateMany(
    user: User | null,
    condition: QueryCondition<E>,
    update: UpdateData<E>,
    query?: CommandOptions<TContext, E>,
  ): Promise<{ affected: number }> {
    return this.executeWithTransaction(query, (tx) =>
      this.repository.updateMany(condition, update, tx),
    );
  }

  async updateManyByIds(
    user: User | null,
    ids: string[],
    update: UpdateData<E>,
    query?: CommandOptions<TContext, E>,
  ): Promise<{ affected: number }> {
    return this.updateMany(user, { id: { $in: ids } } as any, update, query);
  }

  async deleteById(
    user: User | null,
    id: string,
    query?: DeleteCommand & CommandOptions<TContext, E>,
  ): Promise<E> {
    return this.executeWithTransaction(query, async (tx) => {
      const entity = await this.repository.deleteById(id, tx);
      if (!entity) {
        throw new NotFoundException(`${this.notFoundMessage} với ID: ${id}`);
      }
      return entity;
    });
  }

  async deleteOne(
    user: User | null,
    condition: QueryCondition<E>,
    query?: DeleteCommand & CommandOptions<TContext, E>,
  ): Promise<E> {
    return this.executeWithTransaction(query, async (tx) => {
      const entity = await this.repository.deleteOne(condition, tx);
      if (!entity) {
        throw new NotFoundException(this.notFoundMessage);
      }
      return entity;
    });
  }

  async deleteMany(
    user: User | null,
    condition: QueryCondition<E>,
    query?: DeleteCommand & CommandOptions<TContext, E>,
  ): Promise<{ deleted: number }> {
    return this.executeWithTransaction(query, (tx) =>
      this.repository.deleteMany(condition, tx),
    );
  }

  async deleteManyByIds(
    user: User | null,
    ids: string[],
    query?: DeleteCommand & CommandOptions<TContext, E>,
  ): Promise<{ deleted: number }> {
    return this.deleteMany(user, { id: { $in: ids } } as any, query);
  }

  async count(
    user: User | null,
    condition?: QueryCondition<E>,
    query?: QueryOptions<TContext>,
  ): Promise<number> {
    return this.repository.count(condition, query);
  }

  async exists(
    user: User | null,
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
