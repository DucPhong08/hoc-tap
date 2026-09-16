import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/core';
import type {
  QueryCondition,
  PaginationResult,
  UpdateData,
  FindQuery,
  BulkWriteResult,
  BulkDeleteResult,
  IBaseRepository,
} from '@/common/interfaces/repository.interface';
import { BaseEntity } from '@/common/entity/base.entity';
import type { IAuthUser } from '@/common/interfaces/auth-user.interface';

@Injectable()
export abstract class BaseService<
  E extends BaseEntity,
  TContext = EntityManager,
  TCreate = Partial<E>,
  TUpdate = UpdateData<E>,
  TCondition = QueryCondition<E>,
> {
  constructor(protected readonly repository: IBaseRepository<E, TContext>) {}

  protected byIds(ids: string[]): TCondition {
    return { id: { $in: ids } } as unknown as TCondition;
  }

  async create(
    user: IAuthUser,
    dto: TCreate,
    query?: FindQuery<E, TContext>,
  ): Promise<E> {
    return this.repository.create(dto as Partial<E>, query);
  }

  async insertMany(
    user: IAuthUser,
    dtos: TCreate[],
    query?: FindQuery<E, TContext>,
  ): Promise<{ n: number }> {
    return this.repository.insertMany(dtos as Partial<E>[], query);
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
    return this.repository.updateById(id, update as UpdateData<E>, query);
  }

  async updateOne(
    user: IAuthUser,
    condition: TCondition,
    update: TUpdate,
    query?: FindQuery<E, TContext>,
  ): Promise<E | null> {
    return this.repository.updateOne(
      condition as QueryCondition<E>,
      update as UpdateData<E>,
      query,
    );
  }

  async updateMany(
    user: IAuthUser,
    condition: TCondition,
    update: TUpdate,
    query?: FindQuery<E, TContext>,
  ): Promise<BulkWriteResult> {
    return this.repository.updateMany(
      condition as QueryCondition<E>,
      update as UpdateData<E>,
      query,
    );
  }

  async updateManyByIds(
    user: IAuthUser,
    ids: string[],
    update: TUpdate,
    query?: FindQuery<E, TContext>,
  ): Promise<BulkWriteResult> {
    return this.updateMany(user, this.byIds(ids), update, query);
  }

  async deleteById(
    user: IAuthUser,
    id: string,
    query?: FindQuery<E, TContext>,
  ): Promise<E | null> {
    return this.repository.deleteById(id, query);
  }

  async deleteOne(
    user: IAuthUser,
    condition: TCondition,
    query?: FindQuery<E, TContext>,
  ): Promise<E | null> {
    return this.repository.deleteOne(condition as QueryCondition<E>, query);
  }

  async deleteMany(
    user: IAuthUser,
    condition: TCondition,
    query?: FindQuery<E, TContext>,
  ): Promise<BulkDeleteResult> {
    return this.repository.deleteMany(condition as QueryCondition<E>, query);
  }

  async deleteManyByIds(
    user: IAuthUser,
    ids: string[],
    query?: FindQuery<E, TContext>,
  ): Promise<BulkDeleteResult> {
    return this.deleteMany(user, this.byIds(ids), query);
  }
}
