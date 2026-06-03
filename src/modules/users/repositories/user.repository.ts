import { Injectable } from '@nestjs/common';
import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { MikroOrmBaseRepository } from '../../../infra/repositories/mikro-orm-base.repository';
import { InjectEntityRepository } from 'src/database/entity-registry.helper';
import { UserEntity } from '../entities/user.entity';
import type { QueryOptions } from '../../../common/interfaces/repository.interface';

@Injectable()
export class UserRepository extends MikroOrmBaseRepository<
  UserEntity,
  EntityManager
> {
  constructor(
    @InjectEntityRepository(UserEntity)
    repository: EntityRepository<UserEntity>,
  ) {
    super(repository);
  }

  async findByEmail(
    email: string,
    options?: QueryOptions<EntityManager>,
  ): Promise<UserEntity | null> {
    return this.getOne({ email }, options);
  }
}
