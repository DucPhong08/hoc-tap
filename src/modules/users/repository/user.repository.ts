import { EntityManager } from '@mikro-orm/core';
import { InjectEntityManager } from '@mikro-orm/nestjs';
import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { contexts } from '../../../constants';
import { User } from '../domain/user.model';
import { IUserRepository } from '../domain/user.repository.interface';
import { UserEntity } from './entities/user.entity';
import { UserMapper } from './user.mapper';

@Injectable()
export class UserRepository implements IUserRepository {
  private readonly em: EntityManager;

  constructor(
    @InjectEntityManager(contexts.MAIN)
    private readonly db: EntityManager,
    @Inject(UserMapper)
    private readonly mapper: UserMapper,
  ) {
    this.em = this.db.fork();
  }

  async findAll(filter?: any, options?: any): Promise<User[]> {
    const data = await this.em.find(UserEntity, filter || {}, options || {});
    return data.map((item) => this.mapper.toModel(item));
  }

  async findOne(id: string): Promise<User | null> {
    try {
      const entity = await this.em.findOneOrFail(UserEntity, { id } as any);
      return this.mapper.toModel(entity);
    } catch {
      return null;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    const entity = await this.em.findOne(UserEntity, { email });
    return entity ? this.mapper.toModel(entity) : null;
  }

  async create(data: Partial<User>): Promise<User> {
    const entityData = this.mapper.partialToEntity(data);
    const entity = this.em.create(UserEntity, entityData as any);
    await this.em.persistAndFlush(entity);
    return this.mapper.toModel(entity);
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    try {
      const entity = await this.em.findOneOrFail(UserEntity, { id } as any);
      const updateData = this.mapper.partialToEntity(data);
      this.em.assign(entity, updateData);
      await this.em.flush();
      return this.mapper.toModel(entity);
    } catch {
      throw new NotFoundException(`User with id ${id} not found`);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const entity = await this.em.findOneOrFail(UserEntity, { id } as any);
      await this.em.removeAndFlush(entity);
    } catch {
      throw new NotFoundException(`User with id ${id} not found`);
    }
  }
}
