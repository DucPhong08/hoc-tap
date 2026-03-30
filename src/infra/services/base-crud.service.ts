import { Injectable, NotFoundException } from '@nestjs/common';
import type { TransactionOptions } from '@mikro-orm/core';
import type {
  QueryCondition,
  PaginationResult,
  UpdateData,
  FindQuery,
  CreateCommand,
  UpdateCommand,
  DeleteCommand,
  QueryOptions,
  CommandOptions,
} from '../../common/interfaces/repository.interface';
import type { IBaseRepository } from '../../common/interfaces/repository.interface';
import { BaseEntity } from '../../common/entity/base.entity';
import type { BaseCrudServiceConfig } from './base-crud.constant';
import { BaseTransaction } from '../transaction/base-transaction.interface';

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
    dto: Partial<E>,
    options?: CreateCommand & CommandOptions<TContext>,
  ): Promise<E> {
    return this.executeWithTransaction(options, async (txOptions) => {
      return this.repository.create(dto, txOptions);
    });
  }

  async insertMany(
    list: Partial<E>[],
    options?: CommandOptions<TContext>,
  ): Promise<{ n: number }> {
    return this.executeWithTransaction(options, async (txOptions) => {
      return this.repository.insertMany(list, txOptions);
    });
  }

  async getById(
    id: string,
    options?: FindQuery<E> & QueryOptions<TContext>,
  ): Promise<E> {
    const entity = await this.repository.getById(id, options);

    if (!entity) {
      throw new NotFoundException(`${this.notFoundMessage} với ID: ${id}`);
    }

    return entity;
  }

  async getByIdOrNull(
    id: string,
    options?: FindQuery<E> & QueryOptions<TContext>,
  ): Promise<E | null> {
    return this.repository.getById(id, options);
  }

  async getOne(
    condition: QueryCondition<E>,
    options?: FindQuery<E> & QueryOptions<TContext>,
  ): Promise<E> {
    const entity = await this.repository.getOne(condition, options);

    if (!entity) {
      throw new NotFoundException(this.notFoundMessage);
    }

    return entity;
  }

  async getMany(
    condition: QueryCondition<E>,
    options?: FindQuery<E> & QueryOptions<TContext>,
  ): Promise<E[]> {
    return this.repository.getMany(condition, options);
  }

  async getPage(
    condition: QueryCondition<E>,
    options: FindQuery<E> &
      QueryOptions<TContext> & { page: number; limit: number },
  ): Promise<PaginationResult<E>> {
    return this.repository.getPage(condition, options);
  }

  async updateById(
    id: string,
    update: UpdateData<E>,
    options?: UpdateCommand & CommandOptions<TContext>,
  ): Promise<E> {
    return this.executeWithTransaction(options, async (txOptions) => {
      const entity = await this.repository.updateById(id, update, txOptions);

      if (!entity) {
        throw new NotFoundException(`${this.notFoundMessage} với ID: ${id}`);
      }

      return entity;
    });
  }

  async updateOne(
    condition: QueryCondition<E>,
    update: UpdateData<E>,
    options?: UpdateCommand & CommandOptions<TContext>,
  ): Promise<E> {
    return this.executeWithTransaction(options, async (txOptions) => {
      const entity = await this.repository.updateOne(
        condition,
        update,
        txOptions,
      );

      if (!entity) {
        throw new NotFoundException(this.notFoundMessage);
      }

      return entity;
    });
  }

  async updateMany(
    condition: QueryCondition<E>,
    update: UpdateData<E>,
    options?: UpdateCommand & CommandOptions<TContext>,
  ): Promise<{ affected: number }> {
    return this.executeWithTransaction(options, async (txOptions) => {
      return this.repository.updateMany(condition, update, txOptions);
    });
  }

  async updateManyByIds(
    ids: string[],
    update: UpdateData<E>,
    options?: UpdateCommand & CommandOptions<TContext>,
  ): Promise<{ affected: number }> {
    return this.updateMany(
      { _id: { $in: ids } } as unknown as QueryCondition<E>,
      update,
      options,
    );
  }

  async deleteById(
    id: string,
    options?: DeleteCommand & CommandOptions<TContext>,
  ): Promise<E> {
    return this.executeWithTransaction(options, async (txOptions) => {
      const entity = await this.repository.deleteById(id, txOptions);

      if (!entity) {
        throw new NotFoundException(`${this.notFoundMessage} với ID: ${id}`);
      }

      return entity;
    });
  }

  async deleteOne(
    condition: QueryCondition<E>,
    options?: DeleteCommand & CommandOptions<TContext>,
  ): Promise<E> {
    return this.executeWithTransaction(options, async (txOptions) => {
      const entity = await this.repository.deleteOne(condition, txOptions);

      if (!entity) {
        throw new NotFoundException(this.notFoundMessage);
      }

      return entity;
    });
  }

  async deleteMany(
    condition: QueryCondition<E>,
    options?: DeleteCommand & CommandOptions<TContext>,
  ): Promise<{ deleted: number }> {
    return this.executeWithTransaction(options, async (txOptions) => {
      return this.repository.deleteMany(condition, txOptions);
    });
  }

  async deleteManyByIds(
    ids: string[],
    options?: DeleteCommand & CommandOptions<TContext>,
  ): Promise<{ deleted: number }> {
    return this.deleteMany(
      { _id: { $in: ids } } as unknown as QueryCondition<E>,
      options,
    );
  }

  async count(
    condition?: QueryCondition<E>,
    options?: QueryOptions<TContext>,
  ): Promise<number> {
    return this.repository.count(condition, options);
  }

  async exists(
    condition: QueryCondition<E>,
    options?: QueryOptions<TContext>,
  ): Promise<boolean> {
    return this.repository.exists(condition, options);
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
