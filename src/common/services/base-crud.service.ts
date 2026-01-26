import { Injectable } from '@nestjs/common';
import type {
  BaseRepository,
  QueryCondition,
} from '../interfaces/base-repository.interface';
import { BaseEntity } from '../base.entity';

@Injectable()
export abstract class BaseCrudService<E extends BaseEntity> {
  constructor(protected readonly repository: BaseRepository<E>) {}

  async create(data: Partial<E>): Promise<E> {
    return this.repository.create(data);
  }

  async findById(id: string): Promise<E | null> {
    return this.repository.findById(id);
  }

  async findOne(conditions: QueryCondition<E>): Promise<E | null> {
    return this.repository.findOne(conditions);
  }

  async findAll(
    conditions?: QueryCondition<E>,
    page?: number,
    limit?: number,
  ): Promise<{ data: E[]; total: number; page?: number; limit?: number }> {
    if (page !== undefined && limit !== undefined) {
      return this.repository.findWithPagination(conditions || {}, page, limit);
    }
    const data = await this.repository.findAll(conditions);
    const total = await this.repository.count(conditions);
    return { data, total };
  }

  async updateById(id: string, data: Partial<E>): Promise<E | null> {
    return this.repository.updateById(id, data);
  }

  async updateOne(
    conditions: QueryCondition<E>,
    data: Partial<E>,
  ): Promise<E | null> {
    return this.repository.updateOne(conditions, data);
  }

  async deleteById(id: string): Promise<E | null> {
    return this.repository.deleteById(id);
  }

  async deleteOne(conditions: QueryCondition<E>): Promise<E | null> {
    return this.repository.deleteOne(conditions);
  }

  async count(conditions?: QueryCondition<E>): Promise<number> {
    return this.repository.count(conditions);
  }

  async exists(conditions: QueryCondition<E>): Promise<boolean> {
    return this.repository.exists(conditions);
  }
}
