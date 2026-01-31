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

  async getById(
    id: string,
    query?: GetByIdQuery<E> & BaseQueryOption<unknown>,
  ): Promise<E | null> {
    const cacheKey = this.getCacheKey('id', id, query);

    const cached = await this.cacheService.get<E>(cacheKey);
    if (cached) return cached;

    const entity = await super.getById(id, query);
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
    condition: QueryCondition<E>,
    query?: GetOneQuery<E> & BaseQueryOption<unknown>,
  ): Promise<E | null> {
    const cacheKey = this.getCacheKey('one', condition, query);

    const cached = await this.cacheService.get<E>(cacheKey);
    if (cached) return cached;

    const entity = await super.getOne(condition, query);
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
    condition: QueryCondition<E>,
    query?: GetManyQuery<E> & BaseQueryOption<unknown>,
  ): Promise<E[]> {
    const cacheKey = this.getCacheKey('many', condition, query);

    const cached = await this.cacheService.get<E[]>(cacheKey);
    if (cached) return cached;

    const entities = await super.getMany(condition, query);
    await this.cacheService.setWithTags(
      cacheKey,
      entities,
      [this.entityName],
      this.defaultCacheTtl,
    );
    return entities;
  }

  async getPage(
    condition: QueryCondition<E>,
    query: GetPageQuery<E> & BaseQueryOption<unknown>,
  ): Promise<PaginationResult<E>> {
    const { page, limit } = query;
    const cacheKey = this.getCacheKey('page', condition, page, limit, query);

    const cached = await this.cacheService.get<PaginationResult<E>>(cacheKey);
    if (cached) return cached;

    const result = await super.getPage(condition, query);
    await this.cacheService.setWithTags(
      cacheKey,
      result,
      [this.entityName],
      this.defaultCacheTtl,
    );
    return result;
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
