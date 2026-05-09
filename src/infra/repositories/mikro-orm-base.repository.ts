import { EntityManager, EntityRepository, FilterQuery } from '@mikro-orm/core';
import { BaseEntity } from '../../common/entity/base.entity';
import type {
  IBaseRepository,
  QueryCondition,
  FindQuery,
  CreateCommand,
  UpdateCommand,
  DeleteCommand,
  PaginationResult,
  BulkWriteResult,
  BulkDeleteResult,
  UpdateData,
  QueryOptions,
  CommandOptions,
} from '../../common/interfaces/repository.interface';
import {
  buildFindOptions,
  buildUpsertPayload,
  extractUpsertSeed,
  hasUpdateOperators,
} from './mikro-orm-base.repository.helpers';
import { buildFilter } from './mikro-orm/filter.builder';
import { applyUpdate } from './mikro-orm/update.helper';

const PRIMARY_KEY_FIELD = '_id';
const MONGO_DRIVER_NAME_TOKEN = 'Mongo';

type RepositoryContextOptions<TContext extends EntityManager = EntityManager> =
  {
    transaction?: TContext;
  };

type SqlQueryBuilder<
  Row extends Record<string, unknown> = Record<string, unknown>,
> = {
  select(field: string, distinct?: boolean): SqlQueryBuilder<Row>;
  where(condition: object): SqlQueryBuilder<Row>;
  limit(limit: number): SqlQueryBuilder<Row>;
  disableIdentityMap(): SqlQueryBuilder<Row>;
  withDeleted?(): SqlQueryBuilder<Row>;
  execute(): Promise<Row[]>;
};

export abstract class MikroOrmBaseRepository<
  E extends BaseEntity,
  TContext extends EntityManager = EntityManager,
> implements IBaseRepository<E, TContext> {
  constructor(protected readonly repository: EntityRepository<E>) {}

  protected get em(): EntityManager {
    return this.repository.getEntityManager();
  }

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

  async create(
    data: Partial<E>,
    options?: CreateCommand & CommandOptions<TContext>,
  ): Promise<E> {
    const { em, repository } = this.resolveContext(options);
    const entity = repository.create(data as E);

    await em.persist(entity).flush();

    return entity;
  }

  async insertMany(
    data: Partial<E>[],
    options?: CommandOptions<TContext>,
  ): Promise<{ n: number }> {
    const { em, repository } = this.resolveContext(options);
    const entities = data.map((item) => repository.create(item as E));

    await em.persist(entities).flush();

    return { n: entities.length };
  }

  async getById(
    id: string,
    options?: FindQuery<E> & QueryOptions<TContext>,
  ): Promise<E | null> {
    const { repository } = this.resolveContext(options);
    const filter = buildFilter(
      { [PRIMARY_KEY_FIELD]: id } as QueryCondition<E>,
      { withDeleted: options?.withDeleted },
    );
    const findOptions = buildFindOptions(options as FindQuery<E> | undefined);

    return repository.findOne(
      filter,
      findOptions as never,
    ) as Promise<E | null>;
  }

  async getOne(
    condition: QueryCondition<E>,
    options?: FindQuery<E> & QueryOptions<TContext>,
  ): Promise<E | null> {
    const { repository } = this.resolveContext(options);
    const filter = buildFilter(condition, {
      withDeleted: options?.withDeleted,
    });
    const findOptions = buildFindOptions(options as FindQuery<E> | undefined);

    return repository.findOne(
      filter,
      findOptions as never,
    ) as Promise<E | null>;
  }

  async getMany(
    condition: QueryCondition<E>,
    options?: FindQuery<E> & QueryOptions<TContext>,
  ): Promise<E[]> {
    const { repository } = this.resolveContext(options);
    const filter = buildFilter(condition, {
      withDeleted: options?.withDeleted,
    });
    const findOptions = buildFindOptions(options as FindQuery<E> | undefined);

    return repository.find(filter, findOptions as never) as Promise<E[]>;
  }

  async getPage(
    condition: QueryCondition<E>,
    options: FindQuery<E> &
      QueryOptions<TContext> & { page: number; limit: number },
  ): Promise<PaginationResult<E>> {
    const { repository } = this.resolveContext(options);
    const { page, limit } = options;
    const offset = (page - 1) * limit;
    const filter = buildFilter(condition, {
      withDeleted: options.withDeleted,
    });
    const findOptions = buildFindOptions(options as FindQuery<E> | undefined);

    const [data, total] = (await repository.findAndCount(filter, {
      ...findOptions,
      limit,
      offset,
    } as never)) as [E[], number];

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateById(
    id: string,
    data: UpdateData<E>,
    options?: UpdateCommand & CommandOptions<TContext>,
  ): Promise<E | null> {
    const { em, repository } = this.resolveContext(options);
    const entity = await this.getById(id, options);

    if (!entity) {
      if (!options?.upsert) {
        return null;
      }

      const upsertedEntity = await repository.upsert(
        buildUpsertPayload(
          { [PRIMARY_KEY_FIELD]: id } as Partial<E>,
          data,
        ) as E,
      );

      await em.flush();

      return upsertedEntity;
    }

    applyUpdate(entity, data);
    await em.flush();

    return entity;
  }

  async updateOne(
    condition: QueryCondition<E>,
    data: UpdateData<E>,
    options?: UpdateCommand & CommandOptions<TContext>,
  ): Promise<E | null> {
    const { em, repository } = this.resolveContext(options);
    const entity = await this.getOne(condition, options);

    if (!entity) {
      if (!options?.upsert) {
        return null;
      }

      const upsertedEntity = await repository.upsert(
        buildUpsertPayload(extractUpsertSeed(condition), data) as E,
      );

      await em.flush();

      return upsertedEntity;
    }

    applyUpdate(entity, data);
    await em.flush();

    return entity;
  }

  async updateMany(
    condition: QueryCondition<E>,
    data: UpdateData<E>,
    options?: UpdateCommand & CommandOptions<TContext>,
  ): Promise<BulkWriteResult> {
    const { em, repository } = this.resolveContext(options);
    const filter = buildFilter(condition, {
      withDeleted: false,
    });

    if (options?.upsert) {
      throw new Error('updateMany does not support upsert. Use upsertMany().');
    }

    if (!hasUpdateOperators(data)) {
      const affected = await repository.nativeUpdate(filter, data as never);

      return { affected };
    }

    const entities = await repository.find(filter);

    entities.forEach((entity) => {
      applyUpdate(entity, data);
    });

    await em.flush();

    return { affected: entities.length };
  }

  async deleteById(
    id: string,
    options?: DeleteCommand & CommandOptions<TContext>,
  ): Promise<E | null> {
    const { em } = this.resolveContext(options);
    const entity = await this.getById(id, options);
    if (!entity) {
      return null;
    }

    if (options?.soft !== false) {
      entity.deletedAt = new Date();
      await em.flush();
    } else {
      await em.remove(entity).flush();
    }

    return entity;
  }

  async deleteOne(
    condition: QueryCondition<E>,
    options?: DeleteCommand & CommandOptions<TContext>,
  ): Promise<E | null> {
    const { em } = this.resolveContext(options);
    const entity = await this.getOne(condition, options);
    if (!entity) {
      return null;
    }

    if (options?.soft !== false) {
      entity.deletedAt = new Date();
      await em.flush();
    } else {
      await em.remove(entity).flush();
    }

    return entity;
  }

  async deleteMany(
    condition: QueryCondition<E>,
    options?: DeleteCommand & CommandOptions<TContext>,
  ): Promise<BulkDeleteResult> {
    const { em } = this.resolveContext(options);
    const entities = await this.getMany(condition, options);
    const useSoftDelete = options?.soft !== false;

    if (useSoftDelete) {
      const deletedAt = new Date();

      entities.forEach((entity) => {
        entity.deletedAt = deletedAt;
      });

      await em.flush();
    } else {
      await em.remove(entities).flush();
    }

    return { deleted: entities.length };
  }

  async count(
    condition?: QueryCondition<E>,
    options?: QueryOptions<TContext>,
  ): Promise<number> {
    const { repository } = this.resolveContext(options);
    const filter = buildFilter(condition ?? ({} as QueryCondition<E>), {
      withDeleted: options?.withDeleted,
    });

    return repository.count(filter);
  }

  async exists(
    condition: QueryCondition<E>,
    options?: QueryOptions<TContext>,
  ): Promise<boolean> {
    const count = await this.count(condition, options);
    return count > 0;
  }

  async distinct<K extends keyof E>(
    field: K,
    condition?: QueryCondition<E>,
    options?: QueryOptions<TContext>,
  ): Promise<E[K][]> {
    const { em } = this.resolveContext(options);
    const isMongoDriver = em
      .getDriver()
      .constructor.name.includes(MONGO_DRIVER_NAME_TOKEN);
    const fieldName = String(field);
    const filter = buildFilter(condition ?? ({} as QueryCondition<E>), {
      withDeleted: options?.withDeleted,
    });

    if (!isMongoDriver) {
      const rows = await (
        em as unknown as {
          createQueryBuilder(
            entityName: string,
          ): SqlQueryBuilder<Record<string, E[K]>>;
        }
      )
        .createQueryBuilder(this.repository.getEntityName())
        .select(fieldName, true)
        .where(filter as object)
        .execute();

      return rows.map((row) => row[fieldName]);
    }

    const collection = (
      em.getDriver() as unknown as {
        getCollection(entityName: string): {
          distinct(
            distinctField: string,
            distinctCondition: QueryCondition<E>,
          ): Promise<E[K][]>;
        };
      }
    ).getCollection(this.repository.getEntityName());

    return collection.distinct(fieldName, filter);
  }

  async restore(
    id: string,
    options?: CommandOptions<TContext>,
  ): Promise<E | null> {
    const { em, repository } = this.resolveContext(options);
    const entity = (await repository.findOne(
      { [PRIMARY_KEY_FIELD]: id } as FilterQuery<E>,
      { filters: false } as never,
    )) as E | null;

    if (!entity) {
      return null;
    }

    entity.deletedAt = null;
    await em.flush();

    return entity;
  }
}
