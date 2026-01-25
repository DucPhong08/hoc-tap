import { Injectable } from '@nestjs/common';
import type { IBaseRepository } from '../interfaces/base-repository.interface';
import { PaginatedResponseDto } from '../dto/pagination.dto';

@Injectable()
export abstract class BaseCrudService<TModel> {
  constructor(protected readonly repository: IBaseRepository<TModel>) {}

  async findAll(
    filter?: any,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedResponseDto<TModel>> {
    const offset = (page - 1) * limit;
    const data = await this.repository.findAll(filter, { limit, offset });
    const total = data.length;
    return new PaginatedResponseDto(data, total, page, limit);
  }

  async findOne(id: string): Promise<TModel | null> {
    return this.repository.findOne(id);
  }

  async create(data: Partial<TModel>): Promise<TModel> {
    return this.repository.create(data);
  }

  async update(id: string, data: Partial<TModel>): Promise<TModel> {
    return this.repository.update(id, data);
  }

  async remove(id: string): Promise<void> {
    return this.repository.remove(id);
  }
}
