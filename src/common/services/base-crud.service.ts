import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import type {
  BaseRepository,
  QueryCondition,
} from '../interfaces/base-repository.interface';
import { BaseEntity } from '../entity/base.entity';
import { InjectTransaction } from '../transaction/transaction.provider';
import type { BaseTransaction } from '../transaction/base-transaction.interface';

@Injectable()
export abstract class BaseCrudService<E extends BaseEntity> {
  constructor(
    protected readonly repository: BaseRepository<E>,
    @InjectTransaction()
    protected readonly transaction?: BaseTransaction<EntityManager>,
  ) {}

  async create(data: Partial<E>): Promise<E> {
    if (this.transaction) {
      return this.executeInTransaction(async () => {
        return this.repository.create(data);
      });
    }
    return this.repository.create(data);
  }

  async getById(id: string): Promise<E | null> {
    return this.repository.getById(id);
  }

  async getOne(conditions: QueryCondition<E>): Promise<E | null> {
    return this.repository.getOne(conditions);
  }

  async getMany(conditions?: QueryCondition<E>): Promise<E[]> {
    return this.repository.getMany(conditions);
  }

  async getPage(
    conditions: QueryCondition<E>,
    page: number,
    limit: number,
  ): Promise<{ data: E[]; total: number; page: number; limit: number }> {
    return this.repository.getPage(conditions, page, limit);
  }

  async updateById(id: string, data: Partial<E>): Promise<E | null> {
    if (this.transaction) {
      return this.executeInTransaction(async () => {
        return this.repository.updateById(id, data);
      });
    }
    return this.repository.updateById(id, data);
  }

  async updateOne(
    conditions: QueryCondition<E>,
    data: Partial<E>,
  ): Promise<E | null> {
    if (this.transaction) {
      return this.executeInTransaction(async () => {
        return this.repository.updateOne(conditions, data);
      });
    }
    return this.repository.updateOne(conditions, data);
  }

  async deleteById(id: string): Promise<E | null> {
    if (this.transaction) {
      return this.executeInTransaction(async () => {
        return this.repository.deleteById(id);
      });
    }
    return this.repository.deleteById(id);
  }

  async deleteOne(conditions: QueryCondition<E>): Promise<E | null> {
    if (this.transaction) {
      return this.executeInTransaction(async () => {
        return this.repository.deleteOne(conditions);
      });
    }
    return this.repository.deleteOne(conditions);
  }

  async count(conditions?: QueryCondition<E>): Promise<number> {
    return this.repository.count(conditions);
  }

  async exists(conditions: QueryCondition<E>): Promise<boolean> {
    return this.repository.exists(conditions);
  }

  protected async executeInTransaction<T>(
    callback: (trx: EntityManager) => Promise<T>,
    options?: {
      isolationLevel?: 'READ_COMMITTED' | 'REPEATABLE_READ' | 'SERIALIZABLE';
    },
  ): Promise<T> {
    if (!this.transaction) {
      throw new Error('Transaction service not available');
    }

    const trx = await this.transaction.startTransaction(options);
    try {
      const result = await callback(trx);
      await this.transaction.commitTransaction(trx);
      return result;
    } catch (error) {
      await this.transaction.abortTransaction(trx);
      throw error;
    }
  }
}
