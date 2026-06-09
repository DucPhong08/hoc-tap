import { Injectable } from '@nestjs/common';
import { EntityRepository } from '@mikro-orm/core';
import { MikroOrmBaseRepository } from '../../../infra/repositories/mikro-orm-base.repository';
import { InjectEntityRepository } from 'src/database/entity-registry.helper';
import { User } from '../entities/user.entity';

@Injectable()
export class UserRepository extends MikroOrmBaseRepository<User> {
  constructor(
    @InjectEntityRepository(User)
    private readonly userRepo: EntityRepository<User>,
  ) {
    super(userRepo);
  }
}
