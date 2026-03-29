import { EntityManager, EntityRepository, FilterQuery } from '@mikro-orm/core';
import { BaseEntity } from '../../common/entity/base.entity';
import type {
  IBaseRepository,
  QueryCondition,
  FindQuery,
  CreateCommand,
  UpdateCommand,
  DeleteCommand,
  BulkCommand,
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
type RepositoryContextOptions<TContext = unknown> = {
  transaction?: TContext;
};

type SerializableEntity = {
  toJSON(): unknown;
};

type EntityResultCommand<TContext = unknown> =
  RepositoryContextOptions<TContext> & {
    plain?: boolean;
    populate?: CreateCommand['populate'];
  };

type SoftDeleteCommand<TContext = unknown> =
  RepositoryContextOptions<TContext> & {
    soft?: boolean;
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
  TContext = unknown,
> implements IBaseRepository<E, TContext> {
  constructor(
    protected readonly em: EntityManager,
    protected readonly repository: EntityRepository<E>,
  ) {}

  protected get entityName(): string {
    return this.repository.getEntityName();
  }

  private getEntityManager(
    options?: RepositoryContextOptions<TContext>,
  ): EntityManager {
    if (options?.transaction instanceof EntityManager) {
      return options.transaction;
    }

    return this.em;
  }

  private getRepository(
    options?: RepositoryContextOptions<TContext>,
  ): EntityRepository<E> {
    const em = this.getEntityManager(options);

    if (em === this.em) {
      return this.repository;
    }

    return em.getRepository(this.entityName) as unknown as EntityRepository<E>;
  }

  private isMongoDriver(options?: RepositoryContextOptions<TContext>): boolean {
    const driverName =
      this.getEntityManager(options).getDriver().constructor.name;
    return driverName.includes(MONGO_DRIVER_NAME_TOKEN);
  }

  private createSqlQueryBuilder<
    Row extends Record<string, unknown> = Record<string, unknown>,
  >(options?: RepositoryContextOptions<TContext>): SqlQueryBuilder<Row> {
    const em = this.getEntityManager(options);

    if (this.isMongoDriver(options)) {
      throw new Error('createQueryBuilder is not supported for MongoDB driver');
    }

    return (
      em as unknown as {
        createQueryBuilder(entityName: string): SqlQueryBuilder<Row>;
      }
    ).createQueryBuilder(this.entityName);
  }

  private async populateRelations(
    entity: E,
    populate?: CreateCommand['populate'],
    options?: RepositoryContextOptions<TContext>,
  ): Promise<void> {
    if (!populate) {
      return;
    }

    const populateQuery = OptionsBuilder.buildPopulate(populate);
    if (!populateQuery) {
      return;
    }

    await this.getEntityManager(options).populate(
      entity,
      populateQuery as never,
    );
  }

  private serializeEntity(entity: E, plain?: boolean): E {
    if (!plain) {
      return entity;
    }

    return (entity as E & SerializableEntity).toJSON() as E;
  }

  private async updateEntity(
    entity: E,
    data: UpdateData<E>,
    command?: EntityResultCommand<TContext>,
  ): Promise<E> {
    const em = this.getEntityManager(command);

    UpdateHelper.apply(entity, data);
    await em.flush();
    await this.populateRelations(entity, command?.populate, command);

    return this.serializeEntity(entity, command?.plain);
  }

  private async deleteEntity(
    entity: E,
    command?: SoftDeleteCommand<TContext>,
  ): Promise<void> {
    const em = this.getEntityManager(command);
    const useSoftDelete = command?.soft !== false;

    if (useSoftDelete) {
      entity.deletedAt = new Date();
      await em.flush();
      return;
    }

    await em.remove(entity).flush();
  }

  async create(
    data: Partial<E>,
    options?: CreateCommand & CommandOptions<TContext>,
  ): Promise<E> {
    const em = this.getEntityManager(options);
    const repository = this.getRepository(options);
    const entity = repository.create(data as E);

    await em.persist(entity).flush();
    await this.populateRelations(entity, options?.populate, options);

    return this.serializeEntity(entity, options?.plain);
  }

  async insertMany(
    data: Partial<E>[],
    options?: BulkCommand & CommandOptions<TContext>,
  ): Promise<{ n: number }> {
    const em = this.getEntityManager(options);
    const repository = this.getRepository(options);
    const entities = data.map((item) => repository.create(item as E));

    await em.persist(entities).flush();

    return { n: entities.length };
  }

  async getById(
    id: string,
    options?: FindQuery<E> & QueryOptions<TContext>,
  ): Promise<E | null> {
    const repository = this.getRepository(options);
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
    const repository = this.getRepository(options);
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
    const repository = this.getRepository(options);
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
    const repository = this.getRepository(options);
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
    const entity = await this.getById(id, options);
    if (!entity) {
      return null;
    }

    return this.updateEntity(entity, data, options);
  }

  async updateOne(
    condition: QueryCondition<E>,
    data: UpdateData<E>,
    options?: UpdateCommand & CommandOptions<TContext>,
  ): Promise<E | null> {
    const entity = await this.getOne(condition, options);
    if (!entity) {
      return null;
    }

    return this.updateEntity(entity, data, options);
  }

  async updateMany(
    condition: QueryCondition<E>,
    data: UpdateData<E>,
    options?: BulkCommand & CommandOptions<TContext>,
  ): Promise<BulkWriteResult> {
    const em = this.getEntityManager(options);
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
    const entity = await this.getById(id, options);
    if (!entity) {
      return null;
    }

    await this.deleteEntity(entity, options);
    return this.serializeEntity(entity, options?.plain);
  }

  async deleteOne(
    condition: QueryCondition<E>,
    options?: DeleteCommand & CommandOptions<TContext>,
  ): Promise<E | null> {
    const entity = await this.getOne(condition, options);
    if (!entity) {
      return null;
    }

    await this.deleteEntity(entity, options);
    return this.serializeEntity(entity, options?.plain);
  }

  async deleteMany(
    condition: QueryCondition<E>,
    options?: DeleteCommand & CommandOptions<TContext>,
  ): Promise<BulkDeleteResult> {
    const em = this.getEntityManager(options);
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
    const repository = this.getRepository(options);
    const filter = FilterBuilder.build(condition ?? ({} as QueryCondition<E>), {
      withDeleted: options?.withDeleted,
    });

    return repository.count(filter);
  }

  async exists(
    condition: QueryCondition<E>,
    options?: QueryOptions<TContext>,
  ): Promise<boolean> {
    const repository = this.getRepository(options);

    if (this.isMongoDriver(options)) {
      const entity = (await repository.findOne(
        condition as FilterQuery<E>,
        {
          fields: [PRIMARY_KEY_FIELD] as never,
          filters: options?.withDeleted ? false : undefined,
        } as never,
      )) as E | null;

      return entity !== null;
    }

    const qb = this.createSqlQueryBuilder(options)
      .select('1')
      .where(condition)
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
    const fieldName = String(field);

    if (!this.isMongoDriver(options)) {
      const rows = await this.createSqlQueryBuilder<Record<string, E[K]>>(
        options,
      )
        .select(fieldName, true)
        .where(condition ?? {})
        .execute();

      return rows.map((row) => row[fieldName]);
    }

    const collection = (
      this.getEntityManager(options).getDriver() as unknown as {
        getCollection(entityName: string): {
          distinct(
            distinctField: string,
            distinctCondition: QueryCondition<E>,
          ): Promise<E[K][]>;
        };
      }
    ).getCollection(this.entityName);

    return collection.distinct(
      fieldName,
      condition ?? ({} as QueryCondition<E>),
    );
  }

  async restore(
    id: string,
    options?: CommandOptions<TContext>,
  ): Promise<E | null> {
    const repository = this.getRepository(options);
    const em = this.getEntityManager(options);
    const entity = (await repository.findOne(
      { [PRIMARY_KEY_FIELD]: id } as FilterQuery<E>,
      { filters: false } as never,
    )) as E | null;

    if (!entity) {
      return null;
    }

    entity.deletedAt = null;
    await em.flush();

    return this.serializeEntity(entity, options?.plain);
  }
}
