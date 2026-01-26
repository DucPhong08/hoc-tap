import { EntityManager } from '@mikro-orm/core';
import { InjectEntityManager } from '@mikro-orm/nestjs';
import { Injectable, Inject } from '@nestjs/common';
import { contexts } from '../../../constants';
import { User } from '../domain/user.model';
import { IUserRepository } from '../domain/user.repository.interface';
import { UserEntity } from './entities/user.entity';
import { UserMapper } from './user.mapper';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectEntityManager(contexts.MAIN)
    private readonly em: EntityManager,
    @Inject(UserMapper)
    private readonly mapper: UserMapper,
  ) {}

  async findAll(filter?: any, options?: any): Promise<User[]> {
    const entities = await this.em.find(UserEntity, filter || {}, options || {});
    return entities.map((entity) => this.mapper.toModel(entity));
  }

  async findOne(id: string): Promise<User | null> {
    const entity = await this.em.findOne(UserEntity, { _id: id } as any);
    return entity ? this.mapper.toModel(entity) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const entity = await this.em.findOne(UserEntity, { email });
    return entity ? this.mapper.toModel(entity) : null;
  }

  async create(data: Partial<User>): Promise<User> {
    const entityData = this.mapper.partialToEntity(data);
    const entity = this.em.create(UserEntity, entityData as any);
    await this.em.persist(entity).flush();
    return this.mapper.toModel(entity);
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    const entity = await this.em.findOne(UserEntity, { _id: id } as any);
    if (!entity) {
      throw new Error(`User with id ${id} not found`);
    }
    const updateData = this.mapper.partialToEntity(data);
    this.em.assign(entity, updateData);
    await this.em.flush();
    return this.mapper.toModel(entity);
  }

  async remove(id: string): Promise<void> {
    const entity = await this.em.findOne(UserEntity, { _id: id } as any);
    if (!entity) {
      throw new Error(`User with id ${id} not found`);
    }
    await this.em.remove(entity).flush();
  }
}
