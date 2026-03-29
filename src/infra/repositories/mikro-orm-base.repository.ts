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
import { FilterBuilder, UpdateHelper } from './mikro-orm';
import {
  buildFindOptions,
  buildUpsertPayload,
  extractUpsertSeed,
  hasUpdateOperators,
} from './mikro-orm-base.repository.helpers';

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
  constructor(
    protected readonly em: EntityManager,
    protected readonly repository: EntityRepository<E>,
  ) {}

  private getContext(options?: RepositoryContextOptions<TContext>): {
    em: EntityManager;
    repository: EntityRepository<E>;
  } {
    const em = options?.transaction ?? this.em;

    return {
      em,
      repository:
        em === this.em
          ? this.repository
          : (em.getRepository(
              this.repository.getEntityName(),
            ) as unknown as EntityRepository<E>),
    };
  }

  async create(
    data: Partial<E>,
    options?: CreateCommand & CommandOptions<TContext>,
  ): Promise<E> {
    const { em, repository } = this.getContext(options);
    const entity = repository.create(data as E);

    await em.persist(entity).flush();

    if (options?.populate) {
      await em.populate(entity, options.populate as never);
    }

    return entity;
  }

  async insertMany(
    data: Partial<E>[],
    options?: CommandOptions<TContext>,
  ): Promise<{ n: number }> {
    const { em, repository } = this.getContext(options);
    const entities = data.map((item) => repository.create(item as E));

    await em.persist(entities).flush();

    return { n: entities.length };
  }

  async getById(
    id: string,
    options?: FindQuery<E> & QueryOptions<TContext>,
  ): Promise<E | null> {
    const { repository } = this.getContext(options);
    const filter = FilterBuilder.build(
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
    const { repository } = this.getContext(options);
    const filter = FilterBuilder.build(condition, {
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
    const { repository } = this.getContext(options);
    const filter = FilterBuilder.build(condition, {
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
    const { repository } = this.getContext(options);
    const { page, limit } = options;
    const offset = (page - 1) * limit;
    const filter = FilterBuilder.build(condition, {
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
    const { em, repository } = this.getContext(options);
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

      if (options?.populate) {
        await em.populate(upsertedEntity, options.populate as never);
      }

      return upsertedEntity;
    }

    UpdateHelper.apply(entity, data);
    await em.flush();

    if (options?.populate) {
      await em.populate(entity, options.populate as never);
    }

    return entity;
  }

  async updateOne(
    condition: QueryCondition<E>,
    data: UpdateData<E>,
    options?: UpdateCommand & CommandOptions<TContext>,
  ): Promise<E | null> {
    const { em, repository } = this.getContext(options);
    const entity = await this.getOne(condition, options);

    if (!entity) {
      if (!options?.upsert) {
        return null;
      }

      const upsertedEntity = await repository.upsert(
        buildUpsertPayload(extractUpsertSeed(condition), data) as E,
      );

      await em.flush();

      if (options?.populate) {
        await em.populate(upsertedEntity, options.populate as never);
      }

      return upsertedEntity;
    }

    UpdateHelper.apply(entity, data);
    await em.flush();

    if (options?.populate) {
      await em.populate(entity, options.populate as never);
    }

    return entity;
  }

  async updateMany(
    condition: QueryCondition<E>,
    data: UpdateData<E>,
    options?: UpdateCommand & CommandOptions<TContext>,
  ): Promise<BulkWriteResult> {
    const { em, repository } = this.getContext(options);
    const filter = FilterBuilder.build(condition, {
      withDeleted: false,
    });

    if (options?.upsert) {
      throw new Error('updateMany does not support upsert. Use upsertMany().');
    }

    if (!hasUpdateOperators(data)) {
      const affected = await repository.nativeUpdate(
        filter,
        Object.assign({}, data as Partial<E>, {
          updatedAt: new Date(),
        }) as never,
      );

      return { affected };
    }

    const entities = await repository.find(filter);

    entities.forEach((entity) => {
      UpdateHelper.apply(entity, data);
    });

    await em.flush();

    return { affected: entities.length };
  }

  async deleteById(
    id: string,
    options?: DeleteCommand & CommandOptions<TContext>,
  ): Promise<E | null> {
    const { em } = this.getContext(options);
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
    const { em } = this.getContext(options);
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
    const { em } = this.getContext(options);
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
    const { repository } = this.getContext(options);
    const filter = FilterBuilder.build(condition ?? ({} as QueryCondition<E>), {
      withDeleted: options?.withDeleted,
    });

    return repository.count(filter);
  }

  async exists(
    condition: QueryCondition<E>,
    options?: QueryOptions<TContext>,
  ): Promise<boolean> {
    const { repository } = this.getContext(options);
    const filter = FilterBuilder.build(condition, {
      withDeleted: options?.withDeleted,
    });
    const entity = (await repository.findOne(filter, {
      fields: [PRIMARY_KEY_FIELD] as never,
      filters: options?.withDeleted ? false : undefined,
    } as never)) as E | null;

    return entity !== null;
  }

  async distinct<K extends keyof E>(
    field: K,
    condition?: QueryCondition<E>,
    options?: QueryOptions<TContext>,
  ): Promise<E[K][]> {
    const { em } = this.getContext(options);
    const isMongoDriver = em
      .getDriver()
      .constructor.name.includes(MONGO_DRIVER_NAME_TOKEN);
    const fieldName = String(field);
    const filter = FilterBuilder.build(condition ?? ({} as QueryCondition<E>), {
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
    const { em, repository } = this.getContext(options);
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
