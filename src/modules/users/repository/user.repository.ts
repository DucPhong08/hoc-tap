import { Injectable } from '@nestjs/common';
import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { InjectEntityManager, InjectRepository } from '@mikro-orm/nestjs';
import { MikroOrmBaseRepository } from '../../../common/repositories/mikro-orm-base.repository';
import { UserEntity } from '../entities/user.entity';
import { DB_CONTEXTS } from 'src/database/constants';

@Injectable()
export class UserRepository extends MikroOrmBaseRepository<UserEntity> {
  constructor(
    @InjectEntityManager(DB_CONTEXTS.MAIN)
    em: EntityManager,
    @InjectRepository(UserEntity, DB_CONTEXTS.MAIN)
    repository: EntityRepository<UserEntity>,
  ) {
    super(em, repository);
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.repository.findOne({ email });
  }
}
