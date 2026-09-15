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
import {
  resolveContext,
  findOptions,
  populateEntity,
} from './mikro-orm/helpers';
import type { RepositoryConfig } from '@/common/types/repository.types';

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

  private mergeQuery(
    method: 'getById' | 'getOne' | 'getMany' | 'getPage',
    query?: FindQuery<E, TContext>,
  ): FindQuery<E, TContext> | undefined {
    const defaultPopulate = this.config?.populate?.[method];
    if (!defaultPopulate) return query;
    return {
      ...(query ?? {}),
      population: query?.population ?? defaultPopulate,
    } as FindQuery<E, TContext>;
  }

  // ===========================================================================
  // Create
  // ===========================================================================

  async create(data: Partial<E>, query?: FindQuery<E, TContext>): Promise<E> {
    const { em, repository } = resolveContext(this.em, this.repository, query);
    const entity = repository.create(data as EntityData<E>, {
      partial: true,
    });

    await em.persist(entity).flush();

    await populateEntity(em, entity, query);

    return entity;
  }

  async insertMany(
    data: Partial<E>[],
    query?: FindQuery<E, TContext>,
  ): Promise<{ n: number }> {
    const { em, repository } = resolveContext(this.em, this.repository, query);
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
    const mergedQuery = this.mergeQuery('getById', query);
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
    const mergedQuery = this.mergeQuery('getOne', query);
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
    condition?: QueryCondition<E>,
    query?: FindQuery<E, TContext>,
  ): Promise<E[]> {
    const mergedQuery = this.mergeQuery('getMany', query);
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
    condition?: QueryCondition<E>,
    query?: FindQuery<E, TContext>,
  ): Promise<PaginationResult<E>> {
    const mergedQuery = this.mergeQuery('getPage', query) ?? {};
    const page = mergedQuery.page ?? 1;
    const limit = mergedQuery.limit ?? 10;
    const sort = mergedQuery.sort ?? { createdAt: -1 };

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

    const { em } = resolveContext(this.em, this.repository, query);
    wrap(entity).assign(data as any);
    await em.flush();

    return entity;
  }

  async updateMany(
    condition: QueryCondition<E>,
    data: UpdateData<E>,
    query?: FindQuery<E, TContext>,
  ): Promise<BulkWriteResult> {
    const { repository } = resolveContext(this.em, this.repository, query);
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

    const { em } = resolveContext(this.em, this.repository, query);
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
    const { repository } = resolveContext(this.em, this.repository, query);
    const filter = Filter(condition, { softDelete: false });

    if (query?.soft === false) {
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
    const { repository } = resolveContext(this.em, this.repository, query);
    const filter = Filter(condition, {
      softDelete: query?.softDelete,
    });

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

  async restore(id: string, query?: FindQuery<E, TContext>): Promise<E | null> {
    const { em, repository } = resolveContext(this.em, this.repository, query);
    const entity = await repository.findOne(
      Filter({ id } as QueryCondition<E>, { softDelete: true }),
    );

    if (!entity) {
      return null;
    }

    entity.deletedAt = null;
    await em.flush();

    return entity;
  }
}
