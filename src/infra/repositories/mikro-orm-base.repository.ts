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
  DeleteCommand,
  PaginationResult,
  BulkWriteResult,
  BulkDeleteResult,
  UpdateData,
  QueryOptions,
  CommandOptions,
} from '@/common/interfaces/repository.interface';
import { Filter } from './mikro-orm/filter';
import {
  resolveContext,
  findOptions,
  populateEntity,
} from './mikro-orm/helpers';
import { RepositoryConfig } from '@/common/types/repository.types';
import { mergeMethodOptions } from './mikro-orm/populate-config';

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

  getEntityManager(): EntityManager {
    return this.repository.getEntityManager();
  }

  // ===========================================================================
  // Create
  // ===========================================================================

  async create(
    data: Partial<E>,
    options?: CommandOptions<TContext, E>,
  ): Promise<E> {
    const { em, repository } = resolveContext(
      this.em,
      this.repository,
      options,
    );
    const entity = repository.create(data as EntityData<E>, {
      partial: true,
    });

    await em.persist(entity).flush();

    await populateEntity(em, entity, options);

    return entity;
  }

  async insertMany(
    data: Partial<E>[],
    options?: CommandOptions<TContext, E>,
  ): Promise<{ n: number }> {
    const { em, repository } = resolveContext(
      this.em,
      this.repository,
      options,
    );
    const entities = data.map((item) =>
      repository.create(item as EntityData<E>, {
        partial: true,
      }),
    );

    await em.persist(entities).flush();

    return { n: entities.length };
  }

  // ===========================================================================
  // Read
  // ===========================================================================

  async getById(id: string, query?: FindQuery<E, TContext>): Promise<E | null> {
    const mergedQuery = mergeMethodOptions(this.config, 'getById', query);
    const { repository } = resolveContext(
      this.em,
      this.repository,
      mergedQuery,
    );

    return repository.findOne(
      Filter({ id } as QueryCondition<E>, {
        softDelete: mergedQuery?.softDelete,
      }),
      findOptions(mergedQuery),
    ) as Promise<E | null>;
  }

  async getOne(
    condition: QueryCondition<E>,
    query?: FindQuery<E, TContext>,
  ): Promise<E | null> {
    const mergedQuery = mergeMethodOptions(this.config, 'getOne', query);
    const { repository } = resolveContext(
      this.em,
      this.repository,
      mergedQuery,
    );

    return repository.findOne(
      Filter(condition, {
        softDelete: mergedQuery?.softDelete,
      }),
      findOptions(mergedQuery),
    ) as Promise<E | null>;
  }

  async getMany(
    condition: QueryCondition<E>,
    query?: FindQuery<E, TContext>,
  ): Promise<E[]> {
    const mergedQuery = mergeMethodOptions(this.config, 'getMany', query);
    const { repository } = resolveContext(
      this.em,
      this.repository,
      mergedQuery,
    );

    return repository.find(
      Filter(condition, {
        softDelete: mergedQuery?.softDelete,
      }),
      findOptions(mergedQuery),
    ) as Promise<E[]>;
  }

  async getPage(
    condition: QueryCondition<E>,
    query?: FindQuery<E, TContext> & { page?: number; limit?: number },
  ): Promise<PaginationResult<E>> {
    const mergedQuery = mergeMethodOptions(this.config, 'getPage', query) ?? {};
    const page = mergedQuery.page ?? 1;
    const limit = mergedQuery.limit ?? 10;
    const sort = Array.isArray(mergedQuery.sort)
      ? mergedQuery.sort
      : {
          ...mergedQuery.sort,
          createdAt: (mergedQuery.sort as any)?.createdAt ?? -1,
        };

    const { repository } = resolveContext(
      this.em,
      this.repository,
      mergedQuery,
    );
    const offset = (page - 1) * limit;
    const filter = Filter(condition, {
      softDelete: mergedQuery.softDelete,
    });
    const fOptions = findOptions({
      ...mergedQuery,
      sort,
      limit,
      offset,
    });

    const [data, total] = await repository.findAndCount(filter, fOptions);

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
    options?: CommandOptions<TContext, E>,
  ): Promise<E | null> {
    const { em } = resolveContext(this.em, this.repository, options);
    const entity = await this.getById(id, options);

    if (!entity) return null;

    wrap(entity).assign(data as any);
    await em.flush();

    await populateEntity(em, entity, options);

    return entity;
  }

  async updateOne(
    condition: QueryCondition<E>,
    data: UpdateData<E>,
    options?: CommandOptions<TContext, E>,
  ): Promise<E | null> {
    const { em } = resolveContext(this.em, this.repository, options);
    const entity = await this.getOne(condition, options);

    if (!entity) return null;

    wrap(entity).assign(data as any);
    await em.flush();

    await populateEntity(em, entity, options);

    return entity;
  }

  async updateMany(
    condition: QueryCondition<E>,
    data: UpdateData<E>,
    options?: CommandOptions<TContext, E>,
  ): Promise<BulkWriteResult> {
    const { repository } = resolveContext(this.em, this.repository, options);
    const filter = Filter(condition, { softDelete: false });

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
    options?: DeleteCommand & CommandOptions<TContext, E>,
  ): Promise<E | null> {
    return this.deleteOne({ id } as QueryCondition<E>, options);
  }

  async deleteOne(
    condition: QueryCondition<E>,
    options?: DeleteCommand & CommandOptions<TContext, E>,
  ): Promise<E | null> {
    const { em } = resolveContext(this.em, this.repository, options);
    const entity = await this.getOne(condition, options);

    if (!entity) return null;

    if (options?.soft === false) {
      await em.remove(entity).flush();
      return entity;
    }

    entity.deletedAt = new Date();
    await em.flush();

    return entity;
  }

  async deleteMany(
    condition: QueryCondition<E>,
    options?: DeleteCommand & CommandOptions<TContext, E>,
  ): Promise<BulkDeleteResult> {
    const { repository } = resolveContext(this.em, this.repository, options);
    const filter = Filter(condition, { softDelete: false });

    if (options?.soft === false) {
      const deleted = await repository.nativeDelete(filter);
      return { deleted };
    }

    const deleted = await repository.nativeUpdate(filter, {
      deletedAt: new Date(),
    } as any);

    return { deleted };
  }

  // ===========================================================================
  // Aggregate / Query Helpers
  // ===========================================================================

  async count(
    condition?: QueryCondition<E>,
    query?: QueryOptions<TContext>,
  ): Promise<number> {
    const { repository } = resolveContext(this.em, this.repository, query);

    return repository.count(
      Filter(condition, {
        softDelete: query?.softDelete,
      }),
    );
  }

  async exists(
    condition: QueryCondition<E>,
    query?: QueryOptions<TContext>,
  ): Promise<boolean> {
    const { em, repository } = resolveContext(this.em, this.repository, query);
    const filter = Filter(condition, {
      softDelete: query?.softDelete,
    });

    const isMongoDriver = em.getDriver() instanceof MongoDriver;

    if (isMongoDriver) {
      const result = await (repository as MongoEntityRepository<E>)
        .getCollection()
        .findOne(filter as MongoFilter<E>, { projection: { _id: 1 } });
      return !!result;
    }

    const row = await (repository as SqlEntityRepository<E>)
      .createQueryBuilder()
      .select('1')
      .where(filter as QBFilterQuery<E>)
      .limit(1)
      .execute('get', false);

    return !!row;
  }

  async distinct<K extends keyof E>(
    field: K,
    condition?: QueryCondition<E>,
    query?: QueryOptions<TContext>,
  ): Promise<E[K][]> {
    const { em, repository } = resolveContext(this.em, this.repository, query);
    const isMongoDriver = em.getDriver() instanceof MongoDriver;
    const fieldName = String(field);
    const filter = Filter(condition, {
      softDelete: query?.softDelete,
    });

    if (!isMongoDriver) {
      const rows = await (repository as SqlEntityRepository<E>)
        .createQueryBuilder()
        .select(fieldName, true)
        .where(filter as QBFilterQuery<E>)
        .execute('all', true);

      return rows.map((row) => row[fieldName] as E[K]);
    }

    return (repository as MongoEntityRepository<E>)
      .getCollection()
      .distinct(fieldName, filter as MongoFilter<E>) as Promise<E[K][]>;
  }

  // ===========================================================================
  // Restore
  // ===========================================================================

  async restore(
    id: string,
    options?: CommandOptions<TContext, E>,
  ): Promise<E | null> {
    const { em, repository } = resolveContext(
      this.em,
      this.repository,
      options,
    );
    const entity = await repository.findOne({
      id,
    } as any);

    if (!entity) {
      return null;
    }

    entity.deletedAt = null;
    await em.flush();

    return entity;
  }

  keys<K extends keyof E>(...names: K[]): K[] {
    return names;
  }
}
