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

type SerializableEntity = {
  toJSON(): unknown;
};

type EntityResultCommand = {
  plain?: boolean;
  populate?: CreateCommand['populate'];
};

type SoftDeleteCommand = {
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

  private isMongoDriver(): boolean {
    const driverName = this.em.getDriver().constructor.name;
    return driverName.includes(MONGO_DRIVER_NAME_TOKEN);
  }

  private createSqlQueryBuilder<
    Row extends Record<string, unknown> = Record<string, unknown>,
  >(): SqlQueryBuilder<Row> {
    if (this.isMongoDriver()) {
      throw new Error('createQueryBuilder is not supported for MongoDB driver');
    }

    return (
      this.em as unknown as {
        createQueryBuilder(entityName: string): SqlQueryBuilder<Row>;
      }
    ).createQueryBuilder(this.entityName);
  }

  private async populateRelations(
    entity: E,
    populate?: CreateCommand['populate'],
  ): Promise<void> {
    if (!populate) {
      return;
    }

    const populateQuery = OptionsBuilder.buildPopulate(populate);
    if (!populateQuery) {
      return;
    }

    await this.em.populate(entity, populateQuery as never);
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
    command?: EntityResultCommand,
  ): Promise<E> {
    UpdateHelper.apply(entity, data);
    await this.em.flush();
    await this.populateRelations(entity, command?.populate);

    return this.serializeEntity(entity, command?.plain);
  }

  private async deleteEntity(
    entity: E,
    command?: SoftDeleteCommand,
  ): Promise<void> {
    const useSoftDelete = command?.soft !== false;

    if (useSoftDelete) {
      entity.deletedAt = new Date();
      await this.em.flush();
      return;
    }

    await this.em.remove(entity).flush();
  }

  async create(
    data: Partial<E>,
    options?: CreateCommand & CommandOptions<TContext>,
  ): Promise<E> {
    const entity = this.repository.create(data as E);
    await this.em.persist(entity).flush();
    await this.populateRelations(entity, options?.populate);

    return this.serializeEntity(entity, options?.plain);
  }

  async insertMany(
    data: Partial<E>[],
    options?: BulkCommand & CommandOptions<TContext>,
  ): Promise<{ n: number }> {
    void options;

    const entities = data.map((item) => this.repository.create(item as E));
    await this.em.persist(entities).flush();

    return { n: entities.length };
  }

  async getById(
    id: string,
    options?: FindQuery<E> & QueryOptions<TContext>,
  ): Promise<E | null> {
    const filter = FilterBuilder.build(
      { [PRIMARY_KEY_FIELD]: id } as QueryCondition<E>,
      { withDeleted: options?.withDeleted },
    );
    const findOptions = OptionsBuilder.build<E>(options);

    return this.repository.findOne(
      filter,
      findOptions as never,
    ) as Promise<E | null>;
  }

  async getOne(
    condition: QueryCondition<E>,
    options?: FindQuery<E> & QueryOptions<TContext>,
  ): Promise<E | null> {
    const filter = FilterBuilder.build(condition, {
      withDeleted: options?.withDeleted,
    });
    const findOptions = OptionsBuilder.build<E>(options);

    return this.repository.findOne(
      filter,
      findOptions as never,
    ) as Promise<E | null>;
  }

  async getMany(
    condition: QueryCondition<E>,
    options?: FindQuery<E> & QueryOptions<TContext>,
  ): Promise<E[]> {
    const filter = FilterBuilder.build(condition, {
      withDeleted: options?.withDeleted,
    });
    const findOptions = OptionsBuilder.build<E>(options);

    return this.repository.find(filter, findOptions as never) as Promise<E[]>;
  }

  async getPage(
    condition: QueryCondition<E>,
    options: FindQuery<E> &
      QueryOptions<TContext> & { page: number; limit: number },
  ): Promise<PaginationResult<E>> {
    const { page, limit } = options;
    const offset = (page - 1) * limit;
    const filter = FilterBuilder.build(condition, {
      withDeleted: options.withDeleted,
    });
    const findOptions = OptionsBuilder.build<E>(options);

    const [data, total] = (await this.repository.findAndCount(filter, {
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
    const entity = await this.getById(id);
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
    const entity = await this.getOne(condition);
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
    void options;

    const entities = await this.getMany(condition);

    entities.forEach((entity) => {
      UpdateHelper.apply(entity, data);
    });

    await this.em.flush();

    return { affected: entities.length };
  }

  async deleteById(
    id: string,
    options?: DeleteCommand & CommandOptions<TContext>,
  ): Promise<E | null> {
    const entity = await this.getById(id);
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
    const entity = await this.getOne(condition);
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
    const entities = await this.getMany(condition);
    const useSoftDelete = options?.soft !== false;

    if (useSoftDelete) {
      const deletedAt = new Date();

      entities.forEach((entity) => {
        entity.deletedAt = deletedAt;
      });

      await this.em.flush();
    } else {
      await this.em.remove(entities).flush();
    }

    return { deleted: entities.length };
  }

  async count(
    condition?: QueryCondition<E>,
    options?: QueryOptions<TContext>,
  ): Promise<number> {
    const filter = FilterBuilder.build(condition ?? ({} as QueryCondition<E>), {
      withDeleted: options?.withDeleted,
    });

    return this.repository.count(filter);
  }

  async exists(
    condition: QueryCondition<E>,
    options?: QueryOptions<TContext>,
  ): Promise<boolean> {
    if (this.isMongoDriver()) {
      const entity = (await this.repository.findOne(
        condition as FilterQuery<E>,
        {
          fields: [PRIMARY_KEY_FIELD] as never,
          filters: options?.withDeleted ? false : undefined,
        } as never,
      )) as E | null;

      return entity !== null;
    }

    const qb = this.createSqlQueryBuilder()
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
    void options;

    const fieldName = String(field);

    if (!this.isMongoDriver()) {
      const rows = await this.createSqlQueryBuilder<Record<string, E[K]>>()
        .select(fieldName, true)
        .where(condition ?? {})
        .execute();

      return rows.map((row) => row[fieldName]);
    }

    const collection = (
      this.em.getDriver() as unknown as {
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
    const entity = (await this.repository.findOne(
      { [PRIMARY_KEY_FIELD]: id } as FilterQuery<E>,
      { filters: false } as never,
    )) as E | null;

    if (!entity) {
      return null;
    }

    entity.deletedAt = null;
    await this.em.flush();

    return this.serializeEntity(entity, options?.plain);
  }
}
