import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  QueryCondition,
  PaginationResult,
  UpdateData,
  GetByIdQuery,
  GetOneQuery,
  GetManyQuery,
  GetPageQuery,
  CreateCommand,
  InsertManyCommand,
  UpdateByIdCommand,
  UpdateOneCommand,
  UpdateManyCommand,
  DeleteByIdCommand,
  DeleteOneCommand,
  DeleteManyCommand,
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
    command?: CreateCommand & BaseCommandOption<TContext>,
  ): Promise<E> {
    return this.executeWithTransaction(command, async (txCommand) => {
      return this.repository.create(dto, txCommand);
    });
  }

  async insertMany(
    user: UserContext,
    list: Partial<E>[],
    command?: InsertManyCommand & BaseCommandOption<TContext>,
  ): Promise<{ n: number }> {
    return this.executeWithTransaction(command, async (txCommand) => {
      return this.repository.insertMany(list, txCommand);
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
    command?: UpdateByIdCommand & BaseCommandOption<TContext>,
  ): Promise<E> {
    return this.executeWithTransaction(command, async (txCommand) => {
      const entity = await this.repository.updateById(id, update, txCommand);

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
    command?: UpdateOneCommand & BaseCommandOption<TContext>,
  ): Promise<E> {
    return this.executeWithTransaction(command, async (txCommand) => {
      const entity = await this.repository.updateOne(
        condition,
        update,
        txCommand,
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
    command?: UpdateManyCommand & BaseCommandOption<TContext>,
  ): Promise<{ affected: number }> {
    return this.executeWithTransaction(command, async (txCommand) => {
      return this.repository.updateMany(condition, update, txCommand);
    });
  }

  async updateManyByIds(
    user: UserContext,
    ids: string[],
    update: UpdateData<E>,
    command?: UpdateManyCommand & BaseCommandOption<TContext>,
  ): Promise<{ affected: number }> {
    return this.updateMany(
      user,
      { _id: { $in: ids } } as QueryCondition<E>,
      update,
      command,
    );
  }

  async deleteById(
    user: UserContext,
    id: string,
    command?: DeleteByIdCommand & BaseCommandOption<TContext>,
  ): Promise<E> {
    return this.executeWithTransaction(command, async (txCommand) => {
      const entity = await this.repository.deleteById(id, txCommand);

      if (!entity) {
        throw new NotFoundException(`${this.notFoundMessage} với ID: ${id}`);
      }

      return entity;
    });
  }

  async deleteOne(
    user: UserContext,
    condition: QueryCondition<E>,
    command?: DeleteOneCommand & BaseCommandOption<TContext>,
  ): Promise<E> {
    return this.executeWithTransaction(command, async (txCommand) => {
      const entity = await this.repository.deleteOne(condition, txCommand);

      if (!entity) {
        throw new NotFoundException(this.notFoundMessage);
      }

      return entity;
    });
  }

  async deleteMany(
    user: UserContext,
    condition: QueryCondition<E>,
    command?: DeleteManyCommand & BaseCommandOption<TContext>,
  ): Promise<{ deleted: number }> {
    return this.executeWithTransaction(command, async (txCommand) => {
      return this.repository.deleteMany(condition, txCommand);
    });
  }

  async deleteManyByIds(
    user: UserContext,
    ids: string[],
    command?: DeleteManyCommand & BaseCommandOption<TContext>,
  ): Promise<{ deleted: number }> {
    return this.deleteMany(
      user,
      { _id: { $in: ids } } as QueryCondition<E>,
      command,
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
    command: BaseCommandOption<TContext> | undefined,
    callback: (txCommand: BaseCommandOption<TContext>) => Promise<T>,
  ): Promise<T> {
    const hasExternalTransaction = Boolean(command?.transaction);
    const txCommand = command || {};

    if (!hasExternalTransaction && this.transaction) {
      txCommand.transaction = await this.transaction.startTransaction();
    }

    try {
      const result = await callback(txCommand);

      if (
        !hasExternalTransaction &&
        this.transaction &&
        txCommand.transaction
      ) {
        await this.transaction.commitTransaction(txCommand.transaction);
      }

      return result;
    } catch (error) {
      if (
        !hasExternalTransaction &&
        this.transaction &&
        txCommand.transaction
      ) {
        await this.transaction.abortTransaction(txCommand.transaction);
      }
      throw error;
    }
  }
}
