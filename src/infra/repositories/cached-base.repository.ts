import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { BaseEntity } from '../../common/entity/base.entity';
import { MikroOrmBaseRepository } from './mikro-orm-base.repository';
import { RedisCacheService } from '../cache/redis-cache.service';
import {
  QueryCondition,
  GetByIdQuery,
  GetOneQuery,
  GetManyQuery,
  GetPageQuery,
  UpdateByIdQuery,
  UpdateOneQuery,
  UpdateManyQuery,
  DeleteByIdQuery,
  DeleteOneQuery,
  DeleteManyQuery,
  PaginationResult,
  UpdateData,
  BaseQueryOption,
  BaseCommandOption,
} from '../../common/interfaces/repository.interface';

export abstract class CachedBaseRepository<
  E extends BaseEntity,
> extends MikroOrmBaseRepository<E> {
  protected defaultCacheTtl = 300;

  constructor(
    protected readonly em: EntityManager,
    protected readonly repository: EntityRepository<E>,
    protected readonly cacheService: RedisCacheService,
  ) {
    super(em, repository);
  }

  private getCacheKey(prefix: string, ...parts: any[]): string {
    return `${this.entityName}:${prefix}:${parts.map((p) => JSON.stringify(p)).join(':')}`;
  }

  private hasTransaction(
    query?: BaseQueryOption<unknown> | BaseCommandOption<unknown>,
  ): boolean {
    return Boolean(query?.transaction);
  }

  private async readThroughCache<TResult>(
    cacheKey: string,
    query: BaseQueryOption<unknown> | undefined,
    tags: string[],
    fetcher: () => Promise<TResult>,
  ): Promise<TResult> {
    if (this.hasTransaction(query)) {
      return fetcher();
    }

    const cached = await this.cacheService.get<TResult>(cacheKey);
    if (cached !== null && cached !== undefined) {
      return cached;
    }

    const fresh = await fetcher();
    if (fresh !== null && fresh !== undefined) {
      await this.cacheService.setWithTags(
        cacheKey,
        fresh,
        tags,
        this.defaultCacheTtl,
      );
    }

    return fresh;
  }

  async getById(
    id: string,
    query?: GetByIdQuery<E> & BaseQueryOption<unknown>,
  ): Promise<E | null> {
    const cacheKey = this.getCacheKey('id', id, query);
    return this.readThroughCache(
      cacheKey,
      query,
      [this.entityName, `${this.entityName}:${id}`],
      () => super.getById(id, query),
    );
  }

  async getOne(
    condition: QueryCondition<E>,
    query?: GetOneQuery<E> & BaseQueryOption<unknown>,
  ): Promise<E | null> {
    const cacheKey = this.getCacheKey('one', condition, query);
    return this.readThroughCache(cacheKey, query, [this.entityName], () =>
      super.getOne(condition, query),
    );
  }

  async getMany(
    condition: QueryCondition<E>,
    query?: GetManyQuery<E> & BaseQueryOption<unknown>,
  ): Promise<E[]> {
    const cacheKey = this.getCacheKey('many', condition, query);
    return this.readThroughCache(cacheKey, query, [this.entityName], () =>
      super.getMany(condition, query),
    );
  }

  async getPage(
    condition: QueryCondition<E>,
    query: GetPageQuery<E> & BaseQueryOption<unknown>,
  ): Promise<PaginationResult<E>> {
    const { page, limit } = query;
    const cacheKey = this.getCacheKey('page', condition, page, limit, query);
    return this.readThroughCache(cacheKey, query, [this.entityName], () =>
      super.getPage(condition, query),
    );
  }

  async create(
    data: Partial<E>,
    query?: BaseCommandOption<unknown>,
  ): Promise<E> {
    const entity = await super.create(data, query);
    await this.invalidateCache([this.entityName]);
    return entity;
  }

  async insertMany(
    list: Partial<E>[],
    query?: BaseCommandOption<unknown>,
  ): Promise<{ n: number }> {
    const result = await super.insertMany(list, query);
    await this.invalidateCache([this.entityName]);
    return result;
  }

  async distinct<K extends keyof E>(
    field: K,
    condition?: QueryCondition<E>,
    query?: BaseQueryOption<unknown>,
  ): Promise<E[K][]> {
    const cacheKey = this.getCacheKey('distinct', field, condition, query);
    return this.readThroughCache(cacheKey, query, [this.entityName], () =>
      super.distinct(field, condition, query),
    );
  }

  async updateById(
    id: string,
    data: UpdateData<E>,
    query?: UpdateByIdQuery & BaseCommandOption<unknown>,
  ): Promise<E | null> {
    const entity = await super.updateById(id, data, query);
    if (entity) {
      await this.invalidateCache([this.entityName, `${this.entityName}:${id}`]);
    }
    return entity;
  }

  async updateOne(
    condition: QueryCondition<E>,
    data: UpdateData<E>,
    query?: UpdateOneQuery & BaseCommandOption<unknown>,
  ): Promise<E | null> {
    const entity = await super.updateOne(condition, data, query);
    if (entity) {
      await this.invalidateCache([this.entityName]);
    }
    return entity;
  }

  async updateMany(
    condition: QueryCondition<E>,
    data: UpdateData<E>,
    query?: UpdateManyQuery & BaseCommandOption<unknown>,
  ): Promise<{ affected: number }> {
    const result = await super.updateMany(condition, data, query);
    await this.invalidateCache([this.entityName]);
    return result;
  }

  async deleteById(
    id: string,
    query?: DeleteByIdQuery & BaseCommandOption<unknown>,
  ): Promise<E | null> {
    const entity = await super.deleteById(id, query);
    if (entity) {
      await this.invalidateCache([this.entityName, `${this.entityName}:${id}`]);
    }
    return entity;
  }

  async deleteOne(
    condition: QueryCondition<E>,
    query?: DeleteOneQuery & BaseCommandOption<unknown>,
  ): Promise<E | null> {
    const entity = await super.deleteOne(condition, query);
    if (entity) {
      await this.invalidateCache([this.entityName]);
    }
    return entity;
  }

  async deleteMany(
    condition: QueryCondition<E>,
    query?: DeleteManyQuery & BaseCommandOption<unknown>,
  ): Promise<{ deleted: number }> {
    const result = await super.deleteMany(condition, query);
    await this.invalidateCache([this.entityName]);
    return result;
  }

  protected async invalidateCache(tags: string[]): Promise<void> {
    await this.cacheService.delByTags(tags);
  }
}
