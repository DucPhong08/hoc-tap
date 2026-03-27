import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { BaseEntity } from '../../common/entity/base.entity';
import {
  QueryCondition,
  GetByIdQuery,
  GetOneQuery,
  GetManyQuery,
  GetPageQuery,
  CreateCommand,
  InsertManyCommand,
  UpdateByIdCommand,
  UpdateOneCommand,
  UpdateManyCommand,
  DeleteByIdCommand,
  DeleteOneCommand,
  DeleteManyCommand,
  PaginationResult,
  UpdateManyResult,
  DeleteManyResult,
  UpdateData,
  BaseQueryOption,
  BaseCommandOption,
} from '../../common/interfaces/repository.interface';
import { RedisCacheService } from '../cache/redis-cache.service';
import { MikroOrmBaseRepository } from './mikro-orm-base.repository';

const DEFAULT_CACHE_TTL_SECONDS = 300;

type CacheKeyPart = unknown;

type RememberCacheOptions<TValue> = {
  key: string;
  tags: string[];
  load: () => Promise<TValue>;
  shouldCache?: (value: TValue) => boolean;
};

export abstract class CachedBaseRepository<
  E extends BaseEntity,
  TContext = unknown,
> extends MikroOrmBaseRepository<E, TContext> {
  protected readonly defaultCacheTtl = DEFAULT_CACHE_TTL_SECONDS;

  constructor(
    protected readonly em: EntityManager,
    protected readonly repository: EntityRepository<E>,
    protected readonly cacheService: RedisCacheService,
  ) {
    super(em, repository);
  }

  private buildCacheKey(prefix: string, ...parts: CacheKeyPart[]): string {
    const serializedParts = parts.map((part) => JSON.stringify(part)).join(':');
    return `${this.entityName}:${prefix}:${serializedParts}`;
  }

  private buildCacheTags(id?: string): string[] {
    return id
      ? [this.entityName, `${this.entityName}:${id}`]
      : [this.entityName];
  }

  private async rememberCache<TValue>({
    key,
    tags,
    load,
    shouldCache = () => true,
  }: RememberCacheOptions<TValue>): Promise<TValue> {
    const cached = await this.cacheService.get<TValue>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await load();
    if (shouldCache(value)) {
      await this.cacheService.setWithTags(
        key,
        value,
        tags,
        this.defaultCacheTtl,
      );
    }

    return value;
  }

  private async invalidateEntityCache(id?: string): Promise<void> {
    await this.cacheService.delByTags(this.buildCacheTags(id));
  }

  async getById(
    id: string,
    query?: GetByIdQuery<E> & BaseQueryOption<TContext>,
  ): Promise<E | null> {
    return this.rememberCache({
      key: this.buildCacheKey('id', id, query),
      tags: this.buildCacheTags(id),
      load: () => super.getById(id, query),
      shouldCache: (entity) => entity !== null,
    });
  }

  async getOne(
    condition: QueryCondition<E>,
    query?: GetOneQuery<E> & BaseQueryOption<TContext>,
  ): Promise<E | null> {
    return this.rememberCache({
      key: this.buildCacheKey('one', condition, query),
      tags: this.buildCacheTags(),
      load: () => super.getOne(condition, query),
      shouldCache: (entity) => entity !== null,
    });
  }

  async getMany(
    condition: QueryCondition<E>,
    query?: GetManyQuery<E> & BaseQueryOption<TContext>,
  ): Promise<E[]> {
    return this.rememberCache({
      key: this.buildCacheKey('many', condition, query),
      tags: this.buildCacheTags(),
      load: () => super.getMany(condition, query),
    });
  }

  async getPage(
    condition: QueryCondition<E>,
    query: GetPageQuery<E> & BaseQueryOption<TContext>,
  ): Promise<PaginationResult<E>> {
    const { page, limit } = query;

    return this.rememberCache({
      key: this.buildCacheKey('page', condition, page, limit, query),
      tags: this.buildCacheTags(),
      load: () => super.getPage(condition, query),
    });
  }

  async create(
    data: Partial<E>,
    command?: CreateCommand & BaseCommandOption<TContext>,
  ): Promise<E> {
    const entity = await super.create(data, command);
    await this.invalidateEntityCache();

    return entity;
  }

  async insertMany(
    data: Partial<E>[],
    command?: InsertManyCommand & BaseCommandOption<TContext>,
  ): Promise<{ n: number }> {
    const result = await super.insertMany(data, command);
    await this.invalidateEntityCache();

    return result;
  }

  async distinct<K extends keyof E>(
    field: K,
    condition?: QueryCondition<E>,
    query?: BaseQueryOption<TContext>,
  ): Promise<E[K][]> {
    return this.rememberCache({
      key: this.buildCacheKey('distinct', field, condition, query),
      tags: this.buildCacheTags(),
      load: () => super.distinct(field, condition, query),
    });
  }

  async updateById(
    id: string,
    data: UpdateData<E>,
    command?: UpdateByIdCommand & BaseCommandOption<TContext>,
  ): Promise<E | null> {
    const entity = await super.updateById(id, data, command);
    if (entity) {
      await this.invalidateEntityCache(id);
    }

    return entity;
  }

  async updateOne(
    condition: QueryCondition<E>,
    data: UpdateData<E>,
    command?: UpdateOneCommand & BaseCommandOption<TContext>,
  ): Promise<E | null> {
    const entity = await super.updateOne(condition, data, command);
    if (entity) {
      await this.invalidateEntityCache();
    }

    return entity;
  }

  async updateMany(
    condition: QueryCondition<E>,
    data: UpdateData<E>,
    command?: UpdateManyCommand & BaseCommandOption<TContext>,
  ): Promise<UpdateManyResult> {
    const result = await super.updateMany(condition, data, command);
    await this.invalidateEntityCache();

    return result;
  }

  async deleteById(
    id: string,
    command?: DeleteByIdCommand & BaseCommandOption<TContext>,
  ): Promise<E | null> {
    const entity = await super.deleteById(id, command);
    if (entity) {
      await this.invalidateEntityCache(id);
    }

    return entity;
  }

  async deleteOne(
    condition: QueryCondition<E>,
    command?: DeleteOneCommand & BaseCommandOption<TContext>,
  ): Promise<E | null> {
    const entity = await super.deleteOne(condition, command);
    if (entity) {
      await this.invalidateEntityCache();
    }

    return entity;
  }

  async deleteMany(
    condition: QueryCondition<E>,
    command?: DeleteManyCommand & BaseCommandOption<TContext>,
  ): Promise<DeleteManyResult> {
    const result = await super.deleteMany(condition, command);
    await this.invalidateEntityCache();

    return result;
  }

  async restore(
    id: string,
    command?: BaseCommandOption<TContext>,
  ): Promise<E | null> {
    const entity = await super.restore(id, command);
    if (entity) {
      await this.invalidateEntityCache(id);
    }

    return entity;
  }
}
