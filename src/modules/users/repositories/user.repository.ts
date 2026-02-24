import { Injectable } from '@nestjs/common';
import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { InjectEntityManager, InjectRepository } from '@mikro-orm/nestjs';
import { MikroOrmBaseRepository } from '../../../infra/repositories/mikro-orm-base.repository';
import { UserModel } from '../../database/models/user.model';
import { DB_CONTEXTS } from '../../database/constants';

@Injectable()
export class UserRepository extends MikroOrmBaseRepository<UserModel> {
  constructor(
    @InjectEntityManager(DB_CONTEXTS.MAIN)
    em: EntityManager,
    @InjectRepository(UserModel, DB_CONTEXTS.MAIN)
    repository: EntityRepository<UserModel>,
  ) {
    super(em, repository);
  }

  async findByEmail(email: string): Promise<UserModel | null> {
    return this.repository.findOne({ email });
  }
}
