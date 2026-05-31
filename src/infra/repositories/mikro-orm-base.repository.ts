import {
  EntityManager,
  EntityRepository,
  wrap,
  type EntityData,
  type QBFilterQuery,
} from '@mikro-orm/core';
import type { MongoEntityRepository } from '@mikro-orm/mongodb';
import type { Filter as MongoFilter } from 'mongodb';
import type { SqlEntityRepository } from '@mikro-orm/postgresql';
import { BaseEntity } from '../../common/entity/base.entity';
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
} from '../../common/interfaces/repository.interface';
import { buildFilter } from './mikro-orm/filter.builder';

type RepositoryContextOptions<TContext extends EntityManager = EntityManager> =
  {
    transaction?: TContext;
  };

export abstract class MikroOrmBaseRepository<
  E extends BaseEntity,
  TContext extends EntityManager = EntityManager,
> implements IBaseRepository<E, TContext> {
  constructor(protected readonly repository: EntityRepository<E>) {}

  protected get em(): EntityManager {
    return this.repository.getEntityManager();
  }

  // ===========================================================================
  // Context & Driver Helpers
  // ===========================================================================

  private resolveContext(options?: RepositoryContextOptions<TContext>) {
    if (!options?.transaction || options.transaction === this.em) {
      return { em: this.em, repository: this.repository };
    }

    const txEm = options.transaction as EntityManager;

    return {
      em: txEm,
      repository: txEm.getRepository(
        this.repository.getEntityName(),
      ) as unknown as EntityRepository<E>,
    };
  }

  private toFindOptions(query?: FindQuery<E, TContext>): any {
    if (!query) return {};

    const q = query as any;

    const { select, populate, sort, limit, offset, ...rest } = q;

    delete rest.transaction;
    delete rest.softDelete;
    delete rest.page;

    const options: Record<string, any> = {
      fields: select ?? q.fields,
      populate: populate ?? q.populate,
      orderBy: sort ?? q.orderBy,
      limit,
      offset,
      ...rest,
    };

    // Clean undefined properties
    for (const key of Object.keys(options)) {
      if (options[key] === undefined) {
        delete options[key];
      }
    }

    return options;
  }

  private async populateEntity(
    entity: E | null,
    options?: CommandOptions<TContext>,
  ): Promise<E | null> {
    if (!entity) return null;
    const { em } = this.resolveContext(options);

    if (options?.populate) {
      await em.populate(entity, options.populate);
    }

    if (options?.refresh) {
      await em.refresh(entity);
    }

    return entity;
  }

  // ===========================================================================
  // Create
  // ===========================================================================

  async create(
    data: Partial<E>,
    options?: CommandOptions<TContext>,
  ): Promise<E> {
    const { em, repository } = this.resolveContext(options);
    const entity = repository.create(data as EntityData<E>, {
      partial: true,
    });

    await em.persist(entity).flush();

    await this.populateEntity(entity, options);

    return entity;
  }

  async insertMany(
    data: Partial<E>[],
    options?: CommandOptions<TContext>,
  ): Promise<{ n: number }> {
    const { em, repository } = this.resolveContext(options);
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
    const { repository } = this.resolveContext(query);

    return repository.findOne<string, string>(
      buildFilter({ id } as QueryCondition<E>, {
        softDelete: query?.softDelete,
      }),
      this.toFindOptions(query),
    ) as Promise<E | null>;
  }

  async getOne(
    condition: QueryCondition<E>,
    query?: FindQuery<E, TContext>,
  ): Promise<E | null> {
    const { repository } = this.resolveContext(query);

    return repository.findOne<string, string>(
      buildFilter(condition, {
        softDelete: query?.softDelete,
      }),
      this.toFindOptions(query),
    ) as Promise<E | null>;
  }

  async getMany(
    condition: QueryCondition<E>,
    query?: FindQuery<E, TContext>,
  ): Promise<E[]> {
    const { repository } = this.resolveContext(query);

    return repository.find<string, string>(
      buildFilter(condition, {
        softDelete: query?.softDelete,
      }),
      this.toFindOptions(query),
    ) as Promise<E[]>;
  }

  async getPage(
    condition: QueryCondition<E>,
    query: FindQuery<E, TContext> & { page: number; limit: number },
  ): Promise<PaginationResult<E>> {
    const { repository } = this.resolveContext(query);
    const { page, limit } = query;
    const offset = (page - 1) * limit;
    const filter = buildFilter(condition, {
      softDelete: query.softDelete,
    });
    const findOptions = this.toFindOptions(query);

    findOptions.limit = limit;
    findOptions.offset = offset;

    const [data, total] = await repository.findAndCount<string, string>(
      filter,
      findOptions,
    );

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
    options?: CommandOptions<TContext>,
  ): Promise<E | null> {
    const { em } = this.resolveContext(options);
    const entity = await this.getById(id, options);

    if (!entity) return null;

    wrap(entity).assign(data as any);
    await em.flush();

    await this.populateEntity(entity, options);

    return entity;
  }

  async updateOne(
    condition: QueryCondition<E>,
    data: UpdateData<E>,
    options?: CommandOptions<TContext>,
  ): Promise<E | null> {
    const { em } = this.resolveContext(options);
    const entity = await this.getOne(condition, options);

    if (!entity) return null;

    wrap(entity).assign(data as any);
    await em.flush();

    await this.populateEntity(entity, options);

    return entity;
  }

  async updateMany(
    condition: QueryCondition<E>,
    data: UpdateData<E>,
    options?: CommandOptions<TContext>,
  ): Promise<BulkWriteResult> {
    const { repository } = this.resolveContext(options);
    const filter = buildFilter(condition, { softDelete: false });

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
    options?: DeleteCommand & CommandOptions<TContext>,
  ): Promise<E | null> {
    const { em } = this.resolveContext(options);
    const entity = await this.getById(id, options);

    if (!entity) return null;

    if (options?.soft === false) {
      await em.remove(entity).flush();
      return entity;
    }

    entity.deletedAt = new Date();
    await em.flush();

    await this.populateEntity(entity, options);

    return entity;
  }

  async deleteOne(
    condition: QueryCondition<E>,
    options?: DeleteCommand & CommandOptions<TContext>,
  ): Promise<E | null> {
    const { em } = this.resolveContext(options);
    const entity = await this.getOne(condition, options);

    if (!entity) return null;

    if (options?.soft === false) {
      await em.remove(entity).flush();
      return entity;
    }

    entity.deletedAt = new Date();
    await em.flush();

    await this.populateEntity(entity, options);

    return entity;
  }

  async deleteMany(
    condition: QueryCondition<E>,
    options?: DeleteCommand & CommandOptions<TContext>,
  ): Promise<BulkDeleteResult> {
    const { em } = this.resolveContext(options);
    const entities = await this.getMany(condition, options);

    if (options?.soft === false) {
      await em.remove(entities).flush();
      return { deleted: entities.length };
    }

    const deletedAt = new Date();

    entities.forEach((entity) => {
      entity.deletedAt = deletedAt;
    });

    await em.flush();

    return { deleted: entities.length };
  }

  // ===========================================================================
  // Aggregate / Query Helpers
  // ===========================================================================

  async count(
    condition?: QueryCondition<E>,
    query?: QueryOptions<TContext>,
  ): Promise<number> {
    const { repository } = this.resolveContext(query);

    return repository.count(
      buildFilter(condition, {
        softDelete: query?.softDelete,
      }),
    );
  }

  async exists(
    condition: QueryCondition<E>,
    query?: QueryOptions<TContext>,
  ): Promise<boolean> {
    const { repository } = this.resolveContext(query);
    const filter = buildFilter(condition, {
      softDelete: query?.softDelete,
    });

    const result = await repository.findOne(filter, {
      fields: ['id'] as any,
      ...this.toFindOptions(query),
    });

    return result !== null;
  }

  async distinct<K extends keyof E>(
    field: K,
    condition?: QueryCondition<E>,
    query?: QueryOptions<TContext>,
  ): Promise<E[K][]> {
    const { em, repository } = this.resolveContext(query);
    const isMongoDriver = em.getDriver().constructor.name.includes('Mongo');
    const fieldName = String(field);
    const filter = buildFilter(condition, {
      softDelete: query?.softDelete,
    });

    if (!isMongoDriver) {
      const rows = await (repository as SqlEntityRepository<E>)
        .createQueryBuilder()
        .select(fieldName, true)
        .where(filter as QBFilterQuery<E>)
        .execute();

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
    options?: CommandOptions<TContext>,
  ): Promise<E | null> {
    const { em, repository } = this.resolveContext(options);
    const entity = await repository.findOne({
      id,
    } as QueryCondition<E>);

    if (!entity) {
      return null;
    }

    entity.deletedAt = null;
    await em.flush();

    return entity;
  }
}
