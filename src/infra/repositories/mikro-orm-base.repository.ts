import { EntityManager, EntityRepository, FilterQuery } from '@mikro-orm/core';
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

const PRIMARY_KEY_FIELD = '_id';
const MONGO_DRIVER_NAME_TOKEN = 'Mongo';

type SerializableEntity = {
  toJSON(): unknown;
};

type EntityResultQuery = {
  plain?: boolean;
  populate?: CreateQuery['populate'];
};

type RepositoryFindQuery<E, TContext> = BaseQueryOption<TContext> & {
  select?: (keyof E)[];
  populate?: CreateQuery['populate'];
  sort?: Partial<Record<keyof E, 1 | -1>>;
  limit?: number;
  offset?: number;
};

type SoftDeleteQuery = {
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

  private buildIdCondition(id: string): QueryCondition<E> {
    return { [PRIMARY_KEY_FIELD]: id } as QueryCondition<E>;
  }

  private buildFilter(
    condition: QueryCondition<E>,
    withDeleted?: boolean,
  ): FilterQuery<E> {
    return FilterBuilder.build(condition, { withDeleted });
  }

  private buildFindOptions(query?: RepositoryFindQuery<E, TContext>) {
    return OptionsBuilder.build<E>(query);
  }

  private findOneEntity(
    condition: FilterQuery<E>,
    options?: unknown,
  ): Promise<E | null> {
    return this.repository.findOne(
      condition,
      options as never,
    ) as Promise<E | null>;
  }

  private findManyEntities(
    condition: FilterQuery<E>,
    options?: unknown,
  ): Promise<E[]> {
    return this.repository.find(condition, options as never) as Promise<E[]>;
  }

  private findAndCountEntities(
    condition: FilterQuery<E>,
    options?: unknown,
  ): Promise<[E[], number]> {
    return this.repository.findAndCount(condition, options as never) as Promise<
      [E[], number]
    >;
  }

  private async populateEntity(
    entity: E,
    populate?: CreateQuery['populate'],
  ): Promise<void> {
    if (!populate) {
      return;
    }

    const populateOptions = OptionsBuilder.buildPopulate(populate);
    if (!populateOptions) {
      return;
    }

    await this.em.populate(entity, populateOptions as never);
  }

  private serializeEntity(entity: E, plain?: boolean): E {
    if (!plain) {
      return entity;
    }

    return (entity as E & SerializableEntity).toJSON() as E;
  }

  private async prepareEntityResult(
    entity: E,
    query?: EntityResultQuery,
  ): Promise<E> {
    await this.populateEntity(entity, query?.populate);
    return this.serializeEntity(entity, query?.plain);
  }

  private async applyUpdateAndFlush(
    entity: E,
    data: UpdateData<E>,
    query?: EntityResultQuery,
  ): Promise<E> {
    UpdateHelper.apply(entity, data);
    await this.em.flush();

    return this.prepareEntityResult(entity, query);
  }

  private shouldUseSoftDelete(query?: SoftDeleteQuery): boolean {
    return query?.soft !== false;
  }

  private async deleteEntity(
    entity: E,
    query?: SoftDeleteQuery,
  ): Promise<void> {
    if (this.shouldUseSoftDelete(query)) {
      entity.deletedAt = new Date();
      await this.em.flush();
      return;
    }

    await this.em.remove(entity).flush();
  }

  private async deleteEntities(
    entities: E[],
    query?: SoftDeleteQuery,
  ): Promise<void> {
    if (this.shouldUseSoftDelete(query)) {
      const deletedAt = new Date();

      entities.forEach((entity) => {
        entity.deletedAt = deletedAt;
      });

      await this.em.flush();
      return;
    }

    await this.em.remove(entities).flush();
  }

  async create(
    data: Partial<E>,
    query?: CreateQuery & BaseCommandOption<TContext>,
  ): Promise<E> {
    const entity = this.repository.create(data as E);
    await this.em.persist(entity).flush();

    return this.prepareEntityResult(entity, query);
  }

  async insertMany(
    data: Partial<E>[],
    query?: InsertManyQuery & BaseCommandOption<TContext>,
  ): Promise<{ n: number }> {
    void query;
    const entities = data.map((item) => this.repository.create(item as E));
    await this.em.persist(entities).flush();

    return { n: entities.length };
  }

  async getById(
    id: string,
    query?: GetByIdQuery<E> & BaseQueryOption<TContext>,
  ): Promise<E | null> {
    return this.findOneEntity(
      this.buildFilter(this.buildIdCondition(id), query?.withDeleted),
      this.buildFindOptions(query),
    );
  }

  async getOne(
    condition: QueryCondition<E>,
    query?: GetOneQuery<E> & BaseQueryOption<TContext>,
  ): Promise<E | null> {
    return this.findOneEntity(
      this.buildFilter(condition, query?.withDeleted),
      this.buildFindOptions(query),
    );
  }

  async getMany(
    condition: QueryCondition<E>,
    query?: GetManyQuery<E> & BaseQueryOption<TContext>,
  ): Promise<E[]> {
    return this.findManyEntities(
      this.buildFilter(condition, query?.withDeleted),
      this.buildFindOptions(query),
    );
  }

  async getPage(
    condition: QueryCondition<E>,
    query: GetPageQuery<E> & BaseQueryOption<TContext>,
  ): Promise<PaginationResult<E>> {
    const { page, limit } = query;
    const offset = (page - 1) * limit;
    const filter = this.buildFilter(condition, query.withDeleted);
    const findOptions = this.buildFindOptions(query);

    const [data, total] = await this.findAndCountEntities(filter, {
      ...findOptions,
      limit,
      offset,
    });

    return {
      data: data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateById(
    id: string,
    data: UpdateData<E>,
    query?: UpdateByIdQuery & BaseCommandOption<TContext>,
  ): Promise<E | null> {
    const entity = await this.getById(id);
    if (!entity) {
      return null;
    }

    return this.applyUpdateAndFlush(entity, data, query);
  }

  async updateOne(
    condition: QueryCondition<E>,
    data: UpdateData<E>,
    query?: UpdateOneQuery & BaseCommandOption<TContext>,
  ): Promise<E | null> {
    const entity = await this.getOne(condition);
    if (!entity) {
      return null;
    }

    return this.applyUpdateAndFlush(entity, data, query);
  }

  async updateMany(
    condition: QueryCondition<E>,
    data: UpdateData<E>,
    query?: UpdateManyQuery & BaseCommandOption<TContext>,
  ): Promise<UpdateManyResult> {
    void query;
    const entities = await this.getMany(condition);

    entities.forEach((entity) => {
      UpdateHelper.apply(entity, data);
    });

    await this.em.flush();

    return { affected: entities.length };
  }

  async deleteById(
    id: string,
    query?: DeleteByIdQuery & BaseCommandOption<TContext>,
  ): Promise<E | null> {
    const entity = await this.getById(id);
    if (!entity) {
      return null;
    }

    await this.deleteEntity(entity, query);
    return this.serializeEntity(entity, query?.plain);
  }

  async deleteOne(
    condition: QueryCondition<E>,
    query?: DeleteOneQuery & BaseCommandOption<TContext>,
  ): Promise<E | null> {
    const entity = await this.getOne(condition);
    if (!entity) {
      return null;
    }

    await this.deleteEntity(entity, query);
    return this.serializeEntity(entity, query?.plain);
  }

  async deleteMany(
    condition: QueryCondition<E>,
    query?: DeleteManyQuery & BaseCommandOption<TContext>,
  ): Promise<DeleteManyResult> {
    const entities = await this.getMany(condition);
    await this.deleteEntities(entities, query);

    return { deleted: entities.length };
  }

  async count(
    condition?: QueryCondition<E>,
    query?: CountQuery & BaseQueryOption<TContext>,
  ): Promise<number> {
    return this.repository.count(
      this.buildFilter(
        condition ?? ({} as QueryCondition<E>),
        query?.withDeleted,
      ),
    );
  }

  async exists(
    condition: QueryCondition<E>,
    query?: ExistsQuery & BaseQueryOption<TContext>,
  ): Promise<boolean> {
    if (this.isMongoDriver()) {
      const entity = await this.findOneEntity(condition as FilterQuery<E>, {
        ...this.buildFindOptions(query),
        fields: [PRIMARY_KEY_FIELD] as never,
      });

      return entity !== null;
    }

    const qb = this.createSqlQueryBuilder()
      .select('1')
      .where(condition)
      .limit(1);

    if (query?.withDeleted) {
      qb.disableIdentityMap();
      qb.withDeleted?.();
    }

    const result = await qb.execute();
    return result.length > 0;
  }

  async distinct<K extends keyof E>(
    field: K,
    condition?: QueryCondition<E>,
    query?: BaseQueryOption<TContext>,
  ): Promise<E[K][]> {
    void query;
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
    query?: BaseCommandOption<TContext>,
  ): Promise<E | null> {
    const entity = await this.findOneEntity(
      this.buildIdCondition(id) as FilterQuery<E>,
      this.buildFindOptions({ withDeleted: true }),
    );

    if (!entity) {
      return null;
    }

    entity.deletedAt = null;
    await this.em.flush();

    return this.serializeEntity(entity, query?.plain);
  }
}
