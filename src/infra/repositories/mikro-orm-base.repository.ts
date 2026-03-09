import {
  EntityManager,
  EntityRepository,
  FilterQuery,
  type EntityData,
} from '@mikro-orm/core';
import { BaseEntity } from '../../common/entity/base.entity';
import type {
  IBaseRepository,
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
} from '../../common/interfaces/repository.interface';
import { FilterBuilder, OptionsBuilder, UpdateHelper } from './mikro-orm';

type RepositoryQueryContext<T> = BaseQueryOption<T> | BaseCommandOption<T>;

export abstract class MikroOrmBaseRepository<
  E extends BaseEntity,
  T = unknown,
> implements IBaseRepository<E, T> {
  constructor(
    protected readonly em: EntityManager,
    protected readonly repository: EntityRepository<E>,
  ) {}

  protected get entityName(): string {
    return this.repository.getEntityName();
  }

  private isTransactionEntityManager(value: unknown): value is EntityManager {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const candidate = value as Partial<EntityManager>;
    return (
      typeof candidate.getRepository === 'function' &&
      typeof candidate.flush === 'function' &&
      typeof candidate.getDriver === 'function'
    );
  }

  private getContext(query?: RepositoryQueryContext<T>): {
    em: EntityManager;
    repository: EntityRepository<E>;
  } {
    const tx = query?.transaction as unknown;
    if (!this.isTransactionEntityManager(tx)) {
      return { em: this.em, repository: this.repository };
    }

    return {
      em: tx,
      repository: tx.getRepository(
        this.entityName as any,
      ) as unknown as EntityRepository<E>,
    };
  }

  private buildFilter(
    condition?: QueryCondition<E>,
    withDeleted?: boolean,
  ): FilterQuery<E> {
    return FilterBuilder.build(
      condition ?? ({} as unknown as QueryCondition<E>),
      { withDeleted },
    );
  }

  private toResult(entity: E, plain?: boolean): E {
    if (!plain) {
      return entity;
    }

    const serializer = (entity as unknown as { toJSON?: () => E }).toJSON;
    return serializer ? serializer.call(entity) : entity;
  }

  private async populateIfNeeded(
    em: EntityManager,
    entity: E,
    populate?: CreateQuery['populate'],
  ): Promise<void> {
    if (!populate) {
      return;
    }

    const populateOptions = OptionsBuilder.buildPopulate(populate);
    if (populateOptions) {
      await em.populate(entity, populateOptions as any);
    }
  }

  private async findOneForWrite(
    repository: EntityRepository<E>,
    condition: QueryCondition<E>,
  ): Promise<E | null> {
    return repository.findOne(this.buildFilter(condition));
  }

  private byIdCondition(id: string): QueryCondition<E> {
    return { _id: id } as unknown as QueryCondition<E>;
  }

  async create(
    document: Partial<E>,
    query?: CreateQuery & BaseCommandOption<T>,
  ): Promise<E> {
    const { em, repository } = this.getContext(query);
    const entity = repository.create(document as any);
    await em.persist(entity).flush();
    await this.populateIfNeeded(em, entity, query?.populate);
    return this.toResult(entity, query?.plain);
  }

  async insertMany(
    documents: Partial<E>[],
    query?: InsertManyQuery & BaseCommandOption<T>,
  ): Promise<{ n: number }> {
    const { em, repository } = this.getContext(query);
    const entities = documents.map((doc) => repository.create(doc as any));
    await em.persist(entities).flush();
    return { n: entities.length };
  }

  async getById(
    id: string,
    query?: GetByIdQuery<E> & BaseQueryOption<T>,
  ): Promise<E | null> {
    const { repository } = this.getContext(query);
    const filter = this.buildFilter(this.byIdCondition(id), query?.withDeleted);

    return repository.findOne(
      filter,
      OptionsBuilder.build(query) as any,
    ) as Promise<E | null>;
  }

  async getOne(
    condition: QueryCondition<E>,
    query?: GetOneQuery<E> & BaseQueryOption<T>,
  ): Promise<E | null> {
    const { repository } = this.getContext(query);
    const filter = this.buildFilter(condition, query?.withDeleted);
    return repository.findOne(
      filter,
      OptionsBuilder.build(query) as any,
    ) as Promise<E | null>;
  }

  async getMany(
    condition: QueryCondition<E>,
    query?: GetManyQuery<E> & BaseQueryOption<T>,
  ): Promise<E[]> {
    const { repository } = this.getContext(query);
    const filter = this.buildFilter(condition, query?.withDeleted);
    return repository.find(
      filter,
      OptionsBuilder.build(query) as any,
    ) as Promise<E[]>;
  }

  async getPage(
    condition: QueryCondition<E>,
    query: GetPageQuery<E> & BaseQueryOption<T>,
  ): Promise<PaginationResult<E>> {
    const { repository } = this.getContext(query);
    const { page, limit } = query;
    const offset = (page - 1) * limit;
    const filter = this.buildFilter(condition, query?.withDeleted);
    const options = OptionsBuilder.build(query);

    const [data, total] = await repository.findAndCount(filter, {
      ...options,
      limit,
      offset,
    } as any);

    return {
      data: data as E[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateById(
    id: string,
    data: UpdateData<E>,
    query?: UpdateByIdQuery & BaseCommandOption<T>,
  ): Promise<E | null> {
    const { em, repository } = this.getContext(query);
    const entity = await this.findOneForWrite(
      repository,
      this.byIdCondition(id),
    );
    if (!entity) {
      return null;
    }

    UpdateHelper.apply(entity, data);
    await em.flush();
    await this.populateIfNeeded(em, entity, query?.populate);
    return this.toResult(entity, query?.plain);
  }

  async updateOne(
    condition: QueryCondition<E>,
    data: UpdateData<E>,
    query?: UpdateOneQuery & BaseCommandOption<T>,
  ): Promise<E | null> {
    const { em, repository } = this.getContext(query);
    const entity = await this.findOneForWrite(repository, condition);
    if (!entity) {
      return null;
    }

    UpdateHelper.apply(entity, data);
    await em.flush();
    await this.populateIfNeeded(em, entity, query?.populate);
    return this.toResult(entity, query?.plain);
  }

  async updateMany(
    condition: QueryCondition<E>,
    data: UpdateData<E>,
    query?: UpdateManyQuery & BaseCommandOption<T>,
  ): Promise<UpdateManyResult> {
    const { em, repository } = this.getContext(query);
    const filter = this.buildFilter(condition);
    const updateDoc = data as Record<string, unknown>;
    const hasOperators =
      data &&
      typeof data === 'object' &&
      ['$set', '$inc', '$unset', '$push', '$pull'].some(
        (operator) => operator in updateDoc,
      );

    if (!hasOperators) {
      const affected = await repository.nativeUpdate(
        filter,
        data as EntityData<E>,
      );
      return { affected };
    }

    const entities = await repository.find(filter);
    entities.forEach((entity) => UpdateHelper.apply(entity, data));
    await em.flush();

    return { affected: entities.length };
  }

  async deleteById(
    id: string,
    query?: DeleteByIdQuery & BaseCommandOption<T>,
  ): Promise<E | null> {
    const { em, repository } = this.getContext(query);
    const entity = await this.findOneForWrite(
      repository,
      this.byIdCondition(id),
    );
    if (!entity) {
      return null;
    }

    if (query?.soft !== false) {
      entity.deletedAt = new Date();
      await em.flush();
    } else {
      await em.remove(entity).flush();
    }

    return this.toResult(entity, query?.plain);
  }

  async deleteOne(
    condition: QueryCondition<E>,
    query?: DeleteOneQuery & BaseCommandOption<T>,
  ): Promise<E | null> {
    const { em, repository } = this.getContext(query);
    const entity = await this.findOneForWrite(repository, condition);
    if (!entity) {
      return null;
    }

    if (query?.soft !== false) {
      entity.deletedAt = new Date();
      await em.flush();
    } else {
      await em.remove(entity).flush();
    }

    return this.toResult(entity, query?.plain);
  }

  async deleteMany(
    condition: QueryCondition<E>,
    query?: DeleteManyQuery & BaseCommandOption<T>,
  ): Promise<DeleteManyResult> {
    const { repository } = this.getContext(query);
    const filter = this.buildFilter(condition);

    if (query?.soft !== false) {
      const deleted = await repository.nativeUpdate(filter, {
        deletedAt: new Date(),
      } as unknown as EntityData<E>);
      return { deleted };
    }

    const deleted = await repository.nativeDelete(filter);
    return { deleted };
  }

  async count(
    condition?: QueryCondition<E>,
    query?: CountQuery & BaseQueryOption<T>,
  ): Promise<number> {
    const { repository } = this.getContext(query);
    const filter = this.buildFilter(condition, query?.withDeleted);
    return repository.count(filter);
  }

  async exists(
    condition: QueryCondition<E>,
    query?: ExistsQuery & BaseQueryOption<T>,
  ): Promise<boolean> {
    const { repository } = this.getContext(query);
    const filter = this.buildFilter(condition, query?.withDeleted);

    const entity = await repository.findOne(filter, {
      fields: ['_id'] as any,
      filters: query?.withDeleted ? false : undefined,
    } as any);

    return Boolean(entity);
  }

  async distinct<K extends keyof E>(
    field: K,
    condition?: QueryCondition<E>,
    query?: BaseQueryOption<T>,
  ): Promise<E[K][]> {
    const { em, repository } = this.getContext(query);
    const filter = this.buildFilter(condition, query?.withDeleted);

    const isMongo = em.getDriver().constructor.name.includes('Mongo');
    if (!isMongo) {
      const qb = (
        em as unknown as { createQueryBuilder(name: string): any }
      ).createQueryBuilder(this.entityName);
      qb.select(field as string, true).where(filter);

      const rows = await qb.execute();
      return rows.map((row: any) => row[field as string] as E[K]);
    }

    const repoLike = repository as unknown as {
      getCollection?: () => {
        distinct: (
          distinctField: string,
          distinctFilter?: unknown,
        ) => Promise<unknown[]>;
      };
    };
    const collection =
      repoLike.getCollection?.() ??
      (
        em.getDriver() as unknown as {
          getCollection?: (name: string) => {
            distinct: (
              distinctField: string,
              distinctFilter?: unknown,
            ) => Promise<unknown[]>;
          };
        }
      ).getCollection?.(this.entityName);

    if (!collection) {
      throw new Error('Mongo collection is not available');
    }

    const values = await collection.distinct(field as string, filter);
    return values as E[K][];
  }

  async restore(id: string, query?: BaseCommandOption<T>): Promise<E | null> {
    const { em, repository } = this.getContext(query);
    const entity = await repository.findOne(
      { _id: id } as FilterQuery<E>,
      { filters: false } as any,
    );

    if (!entity) {
      return null;
    }

    entity.deletedAt = null;
    await em.flush();
    return this.toResult(entity, query?.plain);
  }
}
