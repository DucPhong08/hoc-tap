import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { BaseEntity } from '../entity/base.entity';
import { MikroOrmBaseRepository } from './mikro-orm-base.repository';
import { RedisCacheService } from '../cache/redis-cache.service';
import {
  QueryCondition,
  QueryOptions,
  PaginationResult,
  UpdateDocument,
} from '../interfaces/base-repository.interface';

export abstract class CachedBaseRepository<
  E extends BaseEntity,
> extends MikroOrmBaseRepository<E> {
  protected abstract entityName: string;
  protected defaultCacheTtl = 300; // 5 minutes

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

  async getById(id: string, options?: QueryOptions<E>): Promise<E | null> {
    const cacheKey = this.getCacheKey('id', id, options);

    const cached = await this.cacheService.get<E>(cacheKey);
    if (cached) return cached;

    const entity = await super.getById(id);
    if (entity) {
      await this.cacheService.setWithTags(
        cacheKey,
        entity,
        [this.entityName, `${this.entityName}:${id}`],
        this.defaultCacheTtl,
      );
    }
    return entity;
  }

  async getOne(
    conditions: QueryCondition<E>,
    options?: QueryOptions<E>,
  ): Promise<E | null> {
    const cacheKey = this.getCacheKey('one', conditions, options);

    const cached = await this.cacheService.get<E>(cacheKey);
    if (cached) return cached;

    const entity = await super.getOne(conditions);
    if (entity) {
      await this.cacheService.setWithTags(
        cacheKey,
        entity,
        [this.entityName],
        this.defaultCacheTtl,
      );
    }
    return entity;
  }

  async getMany(
    conditions?: QueryCondition<E>,
    options?: QueryOptions<E>,
  ): Promise<E[]> {
    const cacheKey = this.getCacheKey('many', conditions, options);

    const cached = await this.cacheService.get<E[]>(cacheKey);
    if (cached) return cached;

    const entities = await super.getMany(conditions, options);
    await this.cacheService.setWithTags(
      cacheKey,
      entities,
      [this.entityName],
      this.defaultCacheTtl,
    );
    return entities;
  }

  async getPage(
    conditions: QueryCondition<E>,
    page: number,
    limit: number,
    options?: QueryOptions<E>,
  ): Promise<PaginationResult<E>> {
    const cacheKey = this.getCacheKey('page', conditions, page, limit, options);

    const cached = await this.cacheService.get<PaginationResult<E>>(cacheKey);
    if (cached) return cached;

    const result = await super.getPage(conditions, page, limit, options);
    await this.cacheService.setWithTags(
      cacheKey,
      result,
      [this.entityName],
      this.defaultCacheTtl,
    );
    return result;
  }

  async updateById(id: string, update: UpdateDocument<E>): Promise<E | null> {
    const entity = await super.updateById(id, update);
    if (entity) {
      await this.invalidateCache([this.entityName, `${this.entityName}:${id}`]);
    }
    return entity;
  }

  async updateOne(
    conditions: QueryCondition<E>,
    update: UpdateDocument<E>,
  ): Promise<E | null> {
    const entity = await super.updateOne(conditions, update);
    if (entity) {
      await this.invalidateCache([this.entityName]);
    }
    return entity;
  }

  async updateMany(
    conditions: QueryCondition<E>,
    update: UpdateDocument<E>,
  ): Promise<{ affected: number }> {
    const result = await super.updateMany(conditions, update);
    await this.invalidateCache([this.entityName]);
    return result;
  }

  async deleteById(id: string): Promise<E | null> {
    const entity = await super.deleteById(id);
    if (entity) {
      await this.invalidateCache([this.entityName, `${this.entityName}:${id}`]);
    }
    return entity;
  }

  async deleteOne(conditions: QueryCondition<E>): Promise<E | null> {
    const entity = await super.deleteOne(conditions);
    if (entity) {
      await this.invalidateCache([this.entityName]);
    }
    return entity;
  }

  async deleteMany(
    conditions: QueryCondition<E>,
  ): Promise<{ deleted: number }> {
    const result = await super.deleteMany(conditions);
    await this.invalidateCache([this.entityName]);
    return result;
  }

  protected async invalidateCache(tags: string[]): Promise<void> {
    await this.cacheService.delByTags(tags);
  }
}
