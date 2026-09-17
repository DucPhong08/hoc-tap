import {
  EntityManager,
  EntityRepository,
  wrap,
  type EntityData,
  type QBFilterQuery,
} from '@mikro-orm/core';
import { MongoDriver, type MongoEntityRepository } from '@mikro-orm/mongodb';
import type { Filter as MongoFilter } from 'mongodb';
import type { SqlEntityRepository } from '@mikro-orm/postgresql';
import { BaseEntity } from '@/common/entity/base.entity';
import type {
  IBaseRepository,
  QueryCondition,
  FindQuery,
  PaginationResult,
  BulkWriteResult,
  BulkDeleteResult,
  UpdateData,
  QueryOptions,
} from '@/common/interfaces/repository.interface';
import { Filter } from './mikro-orm/filter';
import { findOptions, populateEntity, Context } from './mikro-orm/helpers';
import type { RepositoryConfig } from '@/common/types/repository.types';

type ReadMethod = 'getById' | 'getOne' | 'getMany' | 'getPage';

export abstract class MikroOrmBaseRepository<
  E extends BaseEntity,
  TContext extends EntityManager = EntityManager,
> implements IBaseRepository<E, TContext> {
  constructor(
    protected readonly repository: EntityRepository<E>,
    protected readonly config?: RepositoryConfig<E>,
  ) {}

  protected get em(): EntityManager {
    return this.repository.getEntityManager();
  }

  /** repository theo context + filter đã áp soft-delete. */
  private query(condition?: QueryCondition<E>, opts?: QueryOptions<TContext>) {
    const { em, repository } = Context(this.em, this.repository, opts);

    return {
      em,
      repository,
      filter: Filter(condition, { softDelete: opts?.softDelete }),
    };
  }

  /** query + populate mặc định của config + FindOptions. */
  private readQuery(
    method: ReadMethod,
    condition?: QueryCondition<E>,
    opts?: FindQuery<E, TContext>,
  ) {
    const populate = this.config?.populate?.[method];
    const merged =
      populate && !opts?.population
        ? ({ ...opts, population: populate } as FindQuery<E, TContext>)
        : opts;

    return { ...this.query(condition, merged), options: findOptions(merged) };
  }

  // ===========================================================================
  // Create
  // ===========================================================================

  async create(data: Partial<E>, query?: FindQuery<E, TContext>): Promise<E> {
    const { em, repository } = Context(this.em, this.repository, query);
    const entity = repository.create(data as EntityData<E>, { partial: true });

    await em.persist(entity).flush();
    await populateEntity(em, entity, query);

    return entity;
  }

  async insertMany(
    data: Partial<E>[],
    query?: FindQuery<E, TContext>,
  ): Promise<{ n: number }> {
    const { em, repository } = Context(this.em, this.repository, query);
    const entities = data.map((item) =>
      repository.create(item as EntityData<E>, { partial: true }),
    );

    await em.persist(entities).flush();

    return { n: entities.length };
  }

  // ===========================================================================
  // Read
  // ===========================================================================

  async getById(id: string, query?: FindQuery<E, TContext>): Promise<E | null> {
    const { repository, filter, options } = this.readQuery(
      'getById',
      { id } as QueryCondition<E>,
      query,
    );

    return repository.findOne<never, '*'>(filter, options) as Promise<E | null>;
  }

  async getOne(
    condition: QueryCondition<E>,
    query?: FindQuery<E, TContext>,
  ): Promise<E | null> {
    const { repository, filter, options } = this.readQuery(
      'getOne',
      condition,
      query,
    );

    return repository.findOne<never, '*'>(filter, options) as Promise<E | null>;
  }

  async getMany(
    condition?: QueryCondition<E>,
    query?: FindQuery<E, TContext>,
  ): Promise<E[]> {
    const { repository, filter, options } = this.readQuery(
      'getMany',
      condition,
      query,
    );

    return repository.find(filter, options) as Promise<E[]>;
  }

  async getPage(
    condition?: QueryCondition<E>,
    query?: FindQuery<E, TContext>,
  ): Promise<PaginationResult<E>> {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 10;

    const { repository, filter, options } = this.readQuery(
      'getPage',
      condition,
      {
        ...query,
        sort: query?.sort ?? { createdAt: -1 },
        limit,
        offset: (page - 1) * limit,
      } as FindQuery<E, TContext>,
    );

    const [data, total] = await repository.findAndCount(filter, options);

    return {
      data: data as E[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ===========================================================================
  // Update
  // ===========================================================================

  async updateById(
    id: string,
    data: UpdateData<E>,
    query?: FindQuery<E, TContext>,
  ): Promise<E | null> {
    return this.updateOne({ id } as QueryCondition<E>, data, query);
  }

  async updateOne(
    condition: QueryCondition<E>,
    data: UpdateData<E>,
    query?: FindQuery<E, TContext>,
  ): Promise<E | null> {
    const entity = await this.getOne(condition, query);

    if (!entity) return null;

    const { em } = Context(this.em, this.repository, query);
    wrap(entity).assign(data as any);
    await em.flush();

    return entity;
  }

  async updateMany(
    condition: QueryCondition<E>,
    data: UpdateData<E>,
    query?: FindQuery<E, TContext>,
  ): Promise<BulkWriteResult> {
    const { repository, filter } = this.query(condition, {
      ...query,
      softDelete: false,
    } as QueryOptions<TContext>);

    const affected = await repository.nativeUpdate(
      filter,
      data as EntityData<E>,
    );

    return { affected };
  }

  // ===========================================================================
  // Delete
  // ===========================================================================

  async deleteById(
    id: string,
    query?: FindQuery<E, TContext>,
  ): Promise<E | null> {
    return this.deleteOne({ id } as QueryCondition<E>, query);
  }

  async deleteOne(
    condition: QueryCondition<E>,
    query?: FindQuery<E, TContext>,
  ): Promise<E | null> {
    const entity = await this.getOne(condition, query);

    if (!entity) return null;

    const { em } = Context(this.em, this.repository, query);

    if (query?.soft === false) {
      await em.remove(entity).flush();
      return entity;
    }

    entity.deletedAt = new Date();
    await em.flush();

    return entity;
  }

  async deleteMany(
    condition: QueryCondition<E>,
    query?: FindQuery<E, TContext>,
  ): Promise<BulkDeleteResult> {
    const { repository, filter } = this.query(condition, {
      ...query,
      softDelete: false,
    } as QueryOptions<TContext>);

    const deleted =
      query?.soft === false
        ? await repository.nativeDelete(filter)
        : await repository.nativeUpdate(filter, {
            deletedAt: new Date(),
          } as unknown as EntityData<E>);

    return { deleted };
  }

  // ===========================================================================
  // Aggregate / Query Helpers
  // ===========================================================================

  async count(
    condition?: QueryCondition<E>,
    query?: QueryOptions<TContext>,
  ): Promise<number> {
    const { repository, filter } = this.query(condition, query);

    return repository.count(filter);
  }

  async exists(
    condition: QueryCondition<E>,
    query?: QueryOptions<TContext>,
  ): Promise<boolean> {
    const { repository, filter } = this.query(condition, query);
    const entity = await repository.findOne(filter, {
      fields: ['id'] as any,
    });

    return !!entity;
  }

  async distinct<K extends keyof E>(
    field: K,
    condition?: QueryCondition<E>,
    query?: QueryOptions<TContext>,
  ): Promise<E[K][]> {
    const { em, repository, filter } = this.query(condition, query);
    const fieldName = String(field);

    if (em.getDriver() instanceof MongoDriver) {
      return (repository as MongoEntityRepository<E>)
        .getCollection()
        .distinct(fieldName, filter as MongoFilter<E>) as Promise<E[K][]>;
    }

    const rows = await (repository as SqlEntityRepository<E>)
      .createQueryBuilder()
      .select(fieldName, true)
      .where(filter as QBFilterQuery<E>)
      .execute('all', true);

    return rows.map((row) => row[fieldName] as E[K]);
  }

  // ===========================================================================
  // Restore
  // ===========================================================================

  async restore(id: string, query?: FindQuery<E, TContext>): Promise<E | null> {
    const { em, repository, filter } = this.query(
      { id } as QueryCondition<E>,
      { ...query, softDelete: true } as QueryOptions<TContext>,
    );
    const entity = await repository.findOne(filter);

    if (!entity) return null;

    entity.deletedAt = null;
    await em.flush();

    return entity;
  }
}
