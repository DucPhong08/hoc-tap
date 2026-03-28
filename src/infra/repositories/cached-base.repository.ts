import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { BaseEntity } from '../../common/entity/base.entity';
import {
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
    options?: FindQuery<E> & QueryOptions<TContext>,
  ): Promise<E | null> {
    return this.rememberCache({
      key: this.buildCacheKey('id', id, options),
      tags: this.buildCacheTags(id),
      load: () => super.getById(id, options),
      shouldCache: (entity) => entity !== null,
    });
  }

  async getOne(
    condition: QueryCondition<E>,
    options?: FindQuery<E> & QueryOptions<TContext>,
  ): Promise<E | null> {
    return this.rememberCache({
      key: this.buildCacheKey('one', condition, options),
      tags: this.buildCacheTags(),
      load: () => super.getOne(condition, options),
      shouldCache: (entity) => entity !== null,
    });
  }

  async getMany(
    condition: QueryCondition<E>,
    options?: FindQuery<E> & QueryOptions<TContext>,
  ): Promise<E[]> {
    return this.rememberCache({
      key: this.buildCacheKey('many', condition, options),
      tags: this.buildCacheTags(),
      load: () => super.getMany(condition, options),
    });
  }

  async getPage(
    condition: QueryCondition<E>,
    options: FindQuery<E> &
      QueryOptions<TContext> & { page: number; limit: number },
  ): Promise<PaginationResult<E>> {
    const { page, limit } = options;

    return this.rememberCache({
      key: this.buildCacheKey('page', condition, page, limit, options),
      tags: this.buildCacheTags(),
      load: () => super.getPage(condition, options),
    });
  }

  async create(
    data: Partial<E>,
    options?: CreateCommand & CommandOptions<TContext>,
  ): Promise<E> {
    const entity = await super.create(data, options);
    await this.invalidateEntityCache();

    return entity;
  }

  async insertMany(
    data: Partial<E>[],
    options?: BulkCommand & CommandOptions<TContext>,
  ): Promise<{ n: number }> {
    const result = await super.insertMany(data, options);
    await this.invalidateEntityCache();

    return result;
  }

  async distinct<K extends keyof E>(
    field: K,
    condition?: QueryCondition<E>,
    options?: QueryOptions<TContext>,
  ): Promise<E[K][]> {
    return this.rememberCache({
      key: this.buildCacheKey('distinct', field, condition, options),
      tags: this.buildCacheTags(),
      load: () => super.distinct(field, condition, options),
    });
  }

  async updateById(
    id: string,
    data: UpdateData<E>,
    options?: UpdateCommand & CommandOptions<TContext>,
  ): Promise<E | null> {
    const entity = await super.updateById(id, data, options);
    if (entity) {
      await this.invalidateEntityCache(id);
    }

    return entity;
  }

  async updateOne(
    condition: QueryCondition<E>,
    data: UpdateData<E>,
    options?: UpdateCommand & CommandOptions<TContext>,
  ): Promise<E | null> {
    const entity = await super.updateOne(condition, data, options);
    if (entity) {
      await this.invalidateEntityCache();
    }

    return entity;
  }

  async updateMany(
    condition: QueryCondition<E>,
    data: UpdateData<E>,
    options?: BulkCommand & CommandOptions<TContext>,
  ): Promise<BulkWriteResult> {
    const result = await super.updateMany(condition, data, options);
    await this.invalidateEntityCache();

    return result;
  }

  async deleteById(
    id: string,
    options?: DeleteCommand & CommandOptions<TContext>,
  ): Promise<E | null> {
    const entity = await super.deleteById(id, options);
    if (entity) {
      await this.invalidateEntityCache(id);
    }

    return entity;
  }

  async deleteOne(
    condition: QueryCondition<E>,
    options?: DeleteCommand & CommandOptions<TContext>,
  ): Promise<E | null> {
    const entity = await super.deleteOne(condition, options);
    if (entity) {
      await this.invalidateEntityCache();
    }

    return entity;
  }

  async deleteMany(
    condition: QueryCondition<E>,
    options?: DeleteCommand & CommandOptions<TContext>,
  ): Promise<BulkDeleteResult> {
    const result = await super.deleteMany(condition, options);
    await this.invalidateEntityCache();

    return result;
  }

  async restore(
    id: string,
    options?: CommandOptions<TContext>,
  ): Promise<E | null> {
    const entity = await super.restore(id, options);
    if (entity) {
      await this.invalidateEntityCache(id);
    }

    return entity;
  }
}
