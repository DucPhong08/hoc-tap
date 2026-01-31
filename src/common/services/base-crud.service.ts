import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
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
} from '../interfaces/repository.interface';
import type { IBaseRepository } from '../interfaces/repository.interface';
import { BaseEntity } from '../entity/base.entity';
import type { BaseTransaction } from '../transaction/base-transaction.interface';

export interface BaseCrudServiceProperty {
  notFoundCode?: string;
  transaction?: BaseTransaction<EntityManager>;
  upsertKeys?: string[];
}

@Injectable()
export abstract class BaseCrudService<E extends BaseEntity> {
  constructor(
    protected readonly repository: IBaseRepository<E>,
    public readonly property: BaseCrudServiceProperty = {},
  ) {}

  // ============= CREATE =============

  async create(
    user: any,
    dto: Partial<E>,
    query?: CreateQuery<E> & BaseCommandOption<EntityManager>,
  ): Promise<E> {
    query = query || {};
    const internalTransaction = !query.transaction;

    if (internalTransaction && this.property.transaction) {
      query.transaction = await this.property.transaction.startTransaction();
    }

    const { transaction } = query;

    try {
      const res = await this.repository.create(dto, query);

      if (internalTransaction && this.property.transaction) {
        await this.property.transaction.commitTransaction(transaction!);
      }

      return res;
    } catch (err) {
      if (internalTransaction && this.property.transaction) {
        await this.property.transaction.abortTransaction(transaction!);
      }
      throw err;
    }
  }

  async insertMany(
    user: any,
    list: Partial<E>[],
    query?: BaseCommandOption<EntityManager>,
  ): Promise<{ n: number }> {
    query = query || {};
    const internalTransaction = !query.transaction;

    if (internalTransaction && this.property.transaction) {
      query.transaction = await this.property.transaction.startTransaction();
    }

    const { transaction } = query;

    try {
      const res = await this.repository.insertMany(list, query);

      if (internalTransaction && this.property.transaction) {
        await this.property.transaction.commitTransaction(transaction!);
      }

      return res;
    } catch (err) {
      if (internalTransaction && this.property.transaction) {
        await this.property.transaction.abortTransaction(transaction!);
      }
      throw err;
    }
  }

  async getById(
    user: any,
    id: string,
    query?: GetByIdQuery<E> & BaseQueryOption<EntityManager>,
  ): Promise<E | null> {
    const res = await this.repository.getById(id, query);

    if (!res && this.property.notFoundCode) {
      throw new Error(this.property.notFoundCode);
    }

    return res;
  }

  async getOne(
    user: any,
    condition: QueryCondition<E>,
    query?: GetOneQuery<E> & BaseQueryOption<EntityManager>,
  ): Promise<E | null> {
    const res = await this.repository.getOne(condition, query);

    if (!res && this.property.notFoundCode) {
      throw new Error(this.property.notFoundCode);
    }

    return res;
  }

  getMany(
    user: any,
    condition: QueryCondition<E>,
    query?: GetManyQuery<E> & BaseQueryOption<EntityManager>,
  ): Promise<E[]> {
    return this.repository.getMany(condition, query);
  }

  getPage(
    user: any,
    condition: QueryCondition<E>,
    query: GetPageQuery<E> & BaseQueryOption<EntityManager>,
  ): Promise<PaginationResult<E>> {
    return this.repository.getPage(condition, query);
  }

  // ============= UPDATE =============

  async updateById(
    user: any,
    id: string,
    update: UpdateData<E>,
    query?: UpdateByIdQuery<E> & BaseCommandOption<EntityManager>,
  ): Promise<E | null> {
    query = query || {};
    const internalTransaction = !query.transaction;

    if (internalTransaction && this.property.transaction) {
      query.transaction = await this.property.transaction.startTransaction();
    }

    const { transaction } = query;

    try {
      const res = await this.repository.updateById(id, update, query);

      if (!res && this.property.notFoundCode) {
        throw new Error(this.property.notFoundCode);
      }

      if (internalTransaction && this.property.transaction) {
        await this.property.transaction.commitTransaction(transaction!);
      }

      return res;
    } catch (err) {
      if (internalTransaction && this.property.transaction) {
        await this.property.transaction.abortTransaction(transaction!);
      }
      throw err;
    }
  }

  async updateOne(
    user: any,
    condition: QueryCondition<E>,
    update: UpdateData<E>,
    query?: UpdateOneQuery<E> & BaseCommandOption<EntityManager>,
  ): Promise<E | null> {
    query = query || {};
    const internalTransaction = !query.transaction;

    if (internalTransaction && this.property.transaction) {
      query.transaction = await this.property.transaction.startTransaction();
    }

    const { transaction } = query;

    try {
      const res = await this.repository.updateOne(condition, update, query);

      if (!res && this.property.notFoundCode) {
        throw new Error(this.property.notFoundCode);
      }

      if (internalTransaction && this.property.transaction) {
        await this.property.transaction.commitTransaction(transaction!);
      }

      return res;
    } catch (err) {
      if (internalTransaction && this.property.transaction) {
        await this.property.transaction.abortTransaction(transaction!);
      }
      throw err;
    }
  }

  async updateMany(
    user: any,
    condition: QueryCondition<E>,
    update: UpdateData<E>,
    query?: UpdateManyQuery<E> & BaseCommandOption<EntityManager>,
  ): Promise<{ affected: number }> {
    query = query || {};
    const internalTransaction = !query.transaction;

    if (internalTransaction && this.property.transaction) {
      query.transaction = await this.property.transaction.startTransaction();
    }

    const { transaction } = query;

    try {
      const res = await this.repository.updateMany(condition, update, query);

      if (internalTransaction && this.property.transaction) {
        await this.property.transaction.commitTransaction(transaction!);
      }

      return res;
    } catch (err) {
      if (internalTransaction && this.property.transaction) {
        await this.property.transaction.abortTransaction(transaction!);
      }
      throw err;
    }
  }

  async updateManyByIds(
    user: any,
    dto: { ids: string[]; update: UpdateData<E> },
    query?: UpdateManyQuery<E> & BaseCommandOption<EntityManager>,
  ): Promise<{ affected: number }> {
    query = query || {};
    const internalTransaction = !query.transaction;

    if (internalTransaction && this.property.transaction) {
      query.transaction = await this.property.transaction.startTransaction();
    }

    const { transaction } = query;

    try {
      const res = await this.repository.updateMany(
        { _id: { $in: dto.ids } } as any,
        dto.update,
        query,
      );

      if (internalTransaction && this.property.transaction) {
        await this.property.transaction.commitTransaction(transaction!);
      }

      return res;
    } catch (err) {
      if (internalTransaction && this.property.transaction) {
        await this.property.transaction.abortTransaction(transaction!);
      }
      throw err;
    }
  }

  // ============= DELETE =============

  async deleteById(
    user: any,
    id: string,
    query?: DeleteByIdQuery<E> & BaseCommandOption<EntityManager>,
  ): Promise<E | null> {
    query = query || {};
    const internalTransaction = !query.transaction;

    if (internalTransaction && this.property.transaction) {
      query.transaction = await this.property.transaction.startTransaction();
    }

    const { transaction } = query;

    try {
      const res = await this.repository.deleteById(id, query);

      if (!res && this.property.notFoundCode) {
        throw new Error(this.property.notFoundCode);
      }

      if (internalTransaction && this.property.transaction) {
        await this.property.transaction.commitTransaction(transaction!);
      }

      return res;
    } catch (err) {
      if (internalTransaction && this.property.transaction) {
        await this.property.transaction.abortTransaction(transaction!);
      }
      throw err;
    }
  }

  async deleteOne(
    user: any,
    condition: QueryCondition<E>,
    query?: DeleteOneQuery<E> & BaseCommandOption<EntityManager>,
  ): Promise<E | null> {
    query = query || {};
    const internalTransaction = !query.transaction;

    if (internalTransaction && this.property.transaction) {
      query.transaction = await this.property.transaction.startTransaction();
    }

    const { transaction } = query;

    try {
      const res = await this.repository.deleteOne(condition, query);

      if (!res && this.property.notFoundCode) {
        throw new Error(this.property.notFoundCode);
      }

      if (internalTransaction && this.property.transaction) {
        await this.property.transaction.commitTransaction(transaction!);
      }

      return res;
    } catch (err) {
      if (internalTransaction && this.property.transaction) {
        await this.property.transaction.abortTransaction(transaction!);
      }
      throw err;
    }
  }

  async deleteMany(
    user: any,
    condition: QueryCondition<E>,
    query?: DeleteManyQuery<E> & BaseCommandOption<EntityManager>,
  ): Promise<{ deleted: number }> {
    query = query || {};
    const internalTransaction = !query.transaction;

    if (internalTransaction && this.property.transaction) {
      query.transaction = await this.property.transaction.startTransaction();
    }

    const { transaction } = query;

    try {
      const res = await this.repository.deleteMany(condition, query);

      if (internalTransaction && this.property.transaction) {
        await this.property.transaction.commitTransaction(transaction!);
      }

      return res;
    } catch (err) {
      if (internalTransaction && this.property.transaction) {
        await this.property.transaction.abortTransaction(transaction!);
      }
      throw err;
    }
  }

  async deleteManyByIds(
    user: any,
    dto: { ids: string[] },
    query?: DeleteManyQuery<E> & BaseCommandOption<EntityManager>,
  ): Promise<{ deleted: number }> {
    query = query || {};
    const internalTransaction = !query.transaction;

    if (internalTransaction && this.property.transaction) {
      query.transaction = await this.property.transaction.startTransaction();
    }

    const { transaction } = query;

    try {
      const res = await this.repository.deleteMany(
        { _id: { $in: dto.ids } } as any,
        query,
      );

      if (internalTransaction && this.property.transaction) {
        await this.property.transaction.commitTransaction(transaction!);
      }

      return res;
    } catch (err) {
      if (internalTransaction && this.property.transaction) {
        await this.property.transaction.abortTransaction(transaction!);
      }
      throw err;
    }
  }

  // ============= UTILITY =============

  async count(
    user: any,
    condition?: QueryCondition<E>,
    query?: BaseQueryOption<EntityManager>,
  ): Promise<number> {
    return this.repository.count(condition, query);
  }

  async exists(
    user: any,
    condition: QueryCondition<E>,
    query?: BaseQueryOption<EntityManager>,
  ): Promise<boolean> {
    return this.repository.exists(condition, query);
  }

  // ============= RESTORE (Soft Delete) =============

  async restore(
    user: any,
    id: string,
    query?: BaseCommandOption<EntityManager>,
  ): Promise<E | null> {
    query = query || {};
    const internalTransaction = !query.transaction;

    if (internalTransaction && this.property.transaction) {
      query.transaction = await this.property.transaction.startTransaction();
    }

    const { transaction } = query;

    try {
      const res = await this.repository.restore(id, query);

      if (!res && this.property.notFoundCode) {
        throw new Error(this.property.notFoundCode);
      }

      if (internalTransaction && this.property.transaction) {
        await this.property.transaction.commitTransaction(transaction!);
      }

      return res;
    } catch (err) {
      if (internalTransaction && this.property.transaction) {
        await this.property.transaction.abortTransaction(transaction!);
      }
      throw err;
    }
  }
}
