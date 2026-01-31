import { EntityManager, EntityRepository, FilterQuery } from '@mikro-orm/core';
import { BaseEntity } from '../entity/base.entity';
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
} from '../interfaces/repository.interface';
import { FilterBuilder, OptionsBuilder, UpdateHelper } from './mikro-orm';

export abstract class MikroOrmBaseRepository<
  E extends BaseEntity,
  T = unknown,
> implements IBaseRepository<E, T> {
  constructor(
    protected readonly em: EntityManager,
    protected readonly repository: EntityRepository<E>,
  ) {}

  async create(
    document: Partial<E>,
    query?: CreateQuery<E> & BaseCommandOption<T>,
  ): Promise<E> {
    const entity = this.repository.create(document as any);
    await this.em.persist(entity).flush();

    if (query?.populate) {
      await this.em.populate(
        entity,
        OptionsBuilder.buildPopulate(query.populate),
      );
    }

    return query?.plain ? (entity as any).toJSON() : entity;
  }

  async insertMany(
    documents: Partial<E>[],
    query?: InsertManyQuery<E> & BaseCommandOption<T>,
  ): Promise<{ n: number }> {
    void query; // Mark as intentionally unused
    const entities = documents.map((doc) => this.repository.create(doc as any));
    await this.em.persist(entities).flush();
    return { n: entities.length };
  }

  async getById(
    id: string,
    query?: GetByIdQuery<E> & BaseQueryOption<T>,
  ): Promise<E | null> {
    const filter = FilterBuilder.build({ _id: id } as QueryCondition<E>, {
      withDeleted: query?.withDeleted,
    });
    return this.repository.findOne(
      filter,
      OptionsBuilder.build(query) as any,
    ) as Promise<E | null>;
  }

  async getOne(
    condition: QueryCondition<E>,
    query?: GetOneQuery<E> & BaseQueryOption<T>,
  ): Promise<E | null> {
    const filter = FilterBuilder.build(condition, {
      withDeleted: query?.withDeleted,
    });
    const options = OptionsBuilder.build(query);
    return this.repository.findOne(filter, options as any) as Promise<E | null>;
  }

  async getMany(
    condition: QueryCondition<E>,
    query?: GetManyQuery<E> & BaseQueryOption<T>,
  ): Promise<E[]> {
    const filter = FilterBuilder.build(condition, {
      withDeleted: query?.withDeleted,
    });
    const options = OptionsBuilder.build(query);
    return this.repository.find(filter, options as any) as Promise<E[]>;
  }

  async getPage(
    condition: QueryCondition<E>,
    query: GetPageQuery<E> & BaseQueryOption<T>,
  ): Promise<PaginationResult<E>> {
    const { page, limit } = query;
    const offset = (page - 1) * limit;

    const filter = FilterBuilder.build(condition, {
      withDeleted: query?.withDeleted,
    });
    const options = OptionsBuilder.build(query);

    const [data, total] = await this.repository.findAndCount(filter, {
      ...options,
      limit,
      offset,
    } as any);

    const totalPages = Math.ceil(total / limit);

    return {
      data: data as E[],
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async updateById(
    id: string,
    data: UpdateData<E>,
    query?: UpdateByIdQuery<E> & BaseCommandOption<T>,
  ): Promise<E | null> {
    const entity = await this.getById(id);
    if (!entity) return null;

    UpdateHelper.apply(entity, data);
    await this.em.flush();

    if (query?.populate) {
      await this.em.populate(
        entity,
        OptionsBuilder.buildPopulate(query.populate),
      );
    }

    return query?.plain ? (entity as any).toJSON() : entity;
  }

  async updateOne(
    condition: QueryCondition<E>,
    data: UpdateData<E>,
    query?: UpdateOneQuery<E> & BaseCommandOption<T>,
  ): Promise<E | null> {
    const entity = await this.getOne(condition);
    if (!entity) return null;

    UpdateHelper.apply(entity, data);
    await this.em.flush();

    // Populate if needed
    if (query?.populate) {
      await this.em.populate(
        entity,
        OptionsBuilder.buildPopulate(query.populate),
      );
    }

    return query?.plain ? (entity as any).toJSON() : entity;
  }

  async updateMany(
    condition: QueryCondition<E>,
    data: UpdateData<E>,
    query?: UpdateManyQuery<E> & BaseCommandOption<T>,
  ): Promise<UpdateManyResult> {
    void query; // Mark as intentionally unused
    const entities = await this.getMany(condition);

    entities.forEach((entity) => {
      UpdateHelper.apply(entity, data);
    });

    await this.em.flush();
    return { affected: entities.length };
  }

  // ============= DELETE =============

  async deleteById(
    id: string,
    query?: DeleteByIdQuery<E> & BaseCommandOption<T>,
  ): Promise<E | null> {
    const entity = await this.getById(id);
    if (!entity) return null;

    const soft = query?.soft !== false;

    if (soft && 'deletedAt' in entity) {
      (entity as any).deletedAt = new Date();
      await this.em.flush();
    } else {
      await this.em.remove(entity).flush();
    }

    return query?.plain ? (entity as any).toJSON() : entity;
  }

  async deleteOne(
    condition: QueryCondition<E>,
    query?: DeleteOneQuery<E> & BaseCommandOption<T>,
  ): Promise<E | null> {
    const entity = await this.getOne(condition);
    if (!entity) return null;

    const soft = query?.soft !== false;

    if (soft && 'deletedAt' in entity) {
      (entity as any).deletedAt = new Date();
      await this.em.flush();
    } else {
      await this.em.remove(entity).flush();
    }

    return query?.plain ? (entity as any).toJSON() : entity;
  }

  async deleteMany(
    condition: QueryCondition<E>,
    query?: DeleteManyQuery<E> & BaseCommandOption<T>,
  ): Promise<DeleteManyResult> {
    const entities = await this.getMany(condition);
    const soft = query?.soft !== false;

    if (soft) {
      entities.forEach((entity) => {
        if ('deletedAt' in entity) {
          (entity as any).deletedAt = new Date();
        }
      });
      await this.em.flush();
    } else {
      await this.em.remove(entities).flush();
    }

    return { deleted: entities.length };
  }

  async count(
    condition?: QueryCondition<E>,
    query?: CountQuery<E> & BaseQueryOption<T>,
  ): Promise<number> {
    const filter = condition
      ? FilterBuilder.build(condition, { withDeleted: query?.withDeleted })
      : FilterBuilder.build({} as QueryCondition<E>, {
          withDeleted: query?.withDeleted,
        });
    return this.repository.count(filter);
  }

  async exists(
    condition: QueryCondition<E>,
    query?: ExistsQuery<E> & BaseQueryOption<T>,
  ): Promise<boolean> {
    const count = await this.count(condition, query);
    return count > 0;
  }

  async restore(id: string, _query?: BaseCommandOption<T>): Promise<E | null> {
    const entity = await this.repository.findOne(
      { _id: id } as FilterQuery<E>,
      { filters: false } as any,
    );

    if (!entity || !('deletedAt' in entity)) return null;

    (entity as any).deletedAt = null;
    await this.em.flush();

    return _query?.plain ? (entity as any).toJSON() : entity;
  }
}
