import {
  EntityManager,
  EntityRepository,
  FilterQuery,
  wrap,
} from '@mikro-orm/core';
import { BaseEntity } from '../base.entity';
import {
  BaseRepository,
  FindOptions,
  QueryCondition,
  UpdateDocument,
} from '../interfaces/base-repository.interface';

export abstract class MikroOrmBaseRepository<
  E extends BaseEntity,
> implements BaseRepository<E> {
  constructor(
    protected readonly em: EntityManager,
    protected readonly repository: EntityRepository<E>,
  ) {}

  async create(data: Partial<E>): Promise<E> {
    const entity = this.repository.create(data as any);
    await this.em.persist(entity).flush();
    return entity;
  }

  async getById(id: string): Promise<E | null> {
    return this.repository.findOne({ _id: id } as FilterQuery<E>);
  }

  async getOne(conditions: QueryCondition<E>): Promise<E | null> {
    return this.repository.findOne(this.buildFilter(conditions));
  }

  async getMany(
    conditions?: QueryCondition<E>,
    options?: FindOptions,
  ): Promise<E[]> {
    const filter = conditions ? this.buildFilter(conditions) : {};
    return this.repository.findAll({
      where: filter,
      limit: options?.limit,
      offset: options?.offset,
      orderBy: options?.sort as any,
      populate: options?.populate as any,
    });
  }

  async getPage(
    conditions: QueryCondition<E>,
    page: number,
    limit: number,
  ): Promise<{ data: E[]; total: number; page: number; limit: number }> {
    const offset = (page - 1) * limit;
    const filter = this.buildFilter(conditions);

    const [data, total] = await this.repository.findAndCount(filter, {
      limit,
      offset,
    });

    return { data, total, page, limit };
  }

  async updateById(id: string, update: UpdateDocument<E>): Promise<E | null> {
    const entity = await this.getById(id);
    if (!entity) return null;

    this.applyUpdate(entity, update);
    await this.em.flush();
    return entity;
  }

  async updateOne(
    conditions: QueryCondition<E>,
    update: UpdateDocument<E>,
  ): Promise<E | null> {
    const entity = await this.getOne(conditions);
    if (!entity) return null;

    this.applyUpdate(entity, update);
    await this.em.flush();
    return entity;
  }

  async updateMany(
    conditions: QueryCondition<E>,
    update: UpdateDocument<E>,
  ): Promise<{ affected: number }> {
    const entities = await this.getMany(conditions);

    entities.forEach((entity) => {
      this.applyUpdate(entity, update);
    });

    await this.em.flush();
    return { affected: entities.length };
  }

  async deleteById(id: string): Promise<E | null> {
    const entity = await this.getById(id);
    if (!entity) return null;

    await this.em.remove(entity).flush();
    return entity;
  }

  async deleteOne(conditions: QueryCondition<E>): Promise<E | null> {
    const entity = await this.getOne(conditions);
    if (!entity) return null;

    await this.em.remove(entity).flush();
    return entity;
  }

  async deleteMany(
    conditions: QueryCondition<E>,
  ): Promise<{ deleted: number }> {
    const entities = await this.getMany(conditions);
    await this.em.remove(entities).flush();
    return { deleted: entities.length };
  }

  async count(conditions?: QueryCondition<E>): Promise<number> {
    const filter = conditions ? this.buildFilter(conditions) : {};
    return this.repository.count(filter);
  }

  async exists(conditions: QueryCondition<E>): Promise<boolean> {
    const count = await this.count(conditions);
    return count > 0;
  }

  protected buildFilter(conditions: QueryCondition<E>): FilterQuery<E> {
    const filter: any = {};

    for (const [key, value] of Object.entries(conditions)) {
      if (
        value &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        !(value instanceof Date)
      ) {
        // Handle operators like $in, $ne, $gt, $lt
        filter[key] = value;
      } else {
        filter[key] = value;
      }
    }

    return filter as FilterQuery<E>;
  }

  protected applyUpdate(entity: E, update: UpdateDocument<E>): void {
    if ('$inc' in update && update.$inc) {
      // Handle $inc operator
      for (const [key, value] of Object.entries(update.$inc)) {
        if (typeof entity[key] === 'number' && typeof value === 'number') {
          (entity as any)[key] += value;
        }
      }
    } else {
      // Regular update
      wrap(entity).assign(update as any);
    }
  }
}
