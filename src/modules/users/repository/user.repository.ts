import { Injectable } from '@nestjs/common';
import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { InjectEntityManager, InjectRepository } from '@mikro-orm/nestjs';
import { MikroOrmBaseRepository } from '../../../common/repositories/mikro-orm-base.repository';
import { UserEntity } from '../entities/user.entity';
import { contexts } from '../../../constants';

@Injectable()
export class UserRepository extends MikroOrmBaseRepository<UserEntity> {
  constructor(
    @InjectEntityManager(contexts.MAIN)
    em: EntityManager,
    @InjectRepository(UserEntity, contexts.MAIN)
    repository: EntityRepository<UserEntity>,
  ) {
    super(em, repository);
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.repository.findOne({ email });
  }
}
