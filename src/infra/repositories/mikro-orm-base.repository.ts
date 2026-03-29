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
import { FilterBuilder, OptionsBuilder, UpdateHelper } from './mikro-orm';

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
      const populate = OptionsBuilder.buildPopulate(options.populate);

      if (populate) {
        await em.populate(entity, populate as never);
      }
    }

    return options?.plain
      ? ((entity as E & { toJSON(): unknown }).toJSON() as E)
      : entity;
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
    const findOptions = OptionsBuilder.build<E>(options);

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
    const findOptions = OptionsBuilder.build<E>(options);

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
    const findOptions = OptionsBuilder.build<E>(options);

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
    const findOptions = OptionsBuilder.build<E>(options);

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
    let entity = await this.getById(id, options);

    if (!entity) {
      if (!options?.upsert) {
        return null;
      }

      entity = repository.create({ _id: id } as Partial<E> as E);
      UpdateHelper.apply(entity, data);
      await em.persist(entity).flush();

      if (options?.populate) {
        const populate = OptionsBuilder.buildPopulate(options.populate);

        if (populate) {
          await em.populate(entity, populate as never);
        }
      }

      return options?.plain
        ? ((entity as E & { toJSON(): unknown }).toJSON() as E)
        : entity;
    }

    const previousState =
      options?.new === false
        ? ((entity as E & { toJSON(): unknown }).toJSON() as E)
        : null;

    UpdateHelper.apply(entity, data);
    await em.flush();

    if (options?.populate) {
      const populate = OptionsBuilder.buildPopulate(options.populate);

      if (populate) {
        await em.populate(entity, populate as never);
      }
    }

    if (previousState) {
      return options?.plain ? previousState : repository.create(previousState);
    }

    return options?.plain
      ? ((entity as E & { toJSON(): unknown }).toJSON() as E)
      : entity;
  }

  async updateOne(
    condition: QueryCondition<E>,
    data: UpdateData<E>,
    options?: UpdateCommand & CommandOptions<TContext>,
  ): Promise<E | null> {
    const { em, repository } = this.getContext(options);
    let entity = await this.getOne(condition, options);

    if (!entity) {
      if (!options?.upsert) {
        return null;
      }

      const createData: Partial<E> = {};

      for (const [fieldName, value] of Object.entries(condition)) {
        if (
          fieldName === '$and' ||
          fieldName === '$or' ||
          fieldName === '$not'
        ) {
          throw new Error(
            'Upsert only supports direct equality conditions in updateOne.',
          );
        }

        if (
          typeof value === 'object' &&
          value !== null &&
          !Array.isArray(value) &&
          !(value instanceof Date)
        ) {
          if ('$eq' in value) {
            createData[fieldName as keyof E] = value.$eq as E[keyof E];
            continue;
          }

          if (Object.keys(value).some((key) => key.startsWith('$'))) {
            throw new Error(
              'Upsert only supports direct equality conditions in updateOne.',
            );
          }
        }

        createData[fieldName as keyof E] = value as E[keyof E];
      }

      entity = repository.create(createData as E);
      UpdateHelper.apply(entity, data);
      await em.persist(entity).flush();

      if (options?.populate) {
        const populate = OptionsBuilder.buildPopulate(options.populate);

        if (populate) {
          await em.populate(entity, populate as never);
        }
      }

      return options?.plain
        ? ((entity as E & { toJSON(): unknown }).toJSON() as E)
        : entity;
    }

    const previousState =
      options?.new === false
        ? ((entity as E & { toJSON(): unknown }).toJSON() as E)
        : null;

    UpdateHelper.apply(entity, data);
    await em.flush();

    if (options?.populate) {
      const populate = OptionsBuilder.buildPopulate(options.populate);

      if (populate) {
        await em.populate(entity, populate as never);
      }
    }

    if (previousState) {
      return options?.plain ? previousState : repository.create(previousState);
    }

    return options?.plain
      ? ((entity as E & { toJSON(): unknown }).toJSON() as E)
      : entity;
  }

  async updateMany(
    condition: QueryCondition<E>,
    data: UpdateData<E>,
    options?: UpdateCommand & CommandOptions<TContext>,
  ): Promise<BulkWriteResult> {
    const { em } = this.getContext(options);
    const entities = await this.getMany(condition, options);

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

    return options?.plain
      ? ((entity as E & { toJSON(): unknown }).toJSON() as E)
      : entity;
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

    return options?.plain
      ? ((entity as E & { toJSON(): unknown }).toJSON() as E)
      : entity;
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
    const { em, repository } = this.getContext(options);
    const isMongoDriver = em
      .getDriver()
      .constructor.name.includes(MONGO_DRIVER_NAME_TOKEN);

    if (isMongoDriver) {
      const entity = (await repository.findOne(
        condition as FilterQuery<E>,
        {
          fields: [PRIMARY_KEY_FIELD] as never,
          filters: options?.withDeleted ? false : undefined,
        } as never,
      )) as E | null;

      return entity !== null;
    }

    const qb = (
      em as unknown as {
        createQueryBuilder(entityName: string): SqlQueryBuilder;
      }
    )
      .createQueryBuilder(this.repository.getEntityName())
      .select('1')
      .where(condition as object)
      .limit(1);

    if (options?.withDeleted) {
      qb.disableIdentityMap();
      qb.withDeleted?.();
    }

    const result = await qb.execute();
    return result.length > 0;
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
        .where((condition ?? {}) as object)
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

    return collection.distinct(
      fieldName,
      condition ?? ({} as QueryCondition<E>),
    );
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

    return options?.plain
      ? ((entity as E & { toJSON(): unknown }).toJSON() as E)
      : entity;
  }
}
