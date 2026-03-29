import { Injectable } from '@nestjs/common';
import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { InjectEntityManager, InjectRepository } from '@mikro-orm/nestjs';
import { MikroOrmBaseRepository } from '../../../infra/repositories/mikro-orm-base.repository';
import { DB_CONTEXTS } from 'src/database/database.constants';
import { UserEntity } from '../entities/user.entity';
import type { QueryOptions } from '../../../common/interfaces/repository.interface';

@Injectable()
export class UserRepository extends MikroOrmBaseRepository<
  UserEntity,
  EntityManager
> {
  constructor(
    @InjectEntityManager(DB_CONTEXTS.MAIN)
    em: EntityManager,
    @InjectRepository(UserEntity, DB_CONTEXTS.MAIN)
    repository: EntityRepository<UserEntity>,
  ) {
    super(em, repository);
  }

  async findByEmail(
    email: string,
    options?: QueryOptions<EntityManager>,
  ): Promise<UserEntity | null> {
    return this.getOne({ email }, options);
  }
}
