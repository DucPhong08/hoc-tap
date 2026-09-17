import { Injectable } from '@nestjs/common';
import { EntityRepository } from '@mikro-orm/core';
import { MikroOrmBaseRepository } from '@/infra/repositories/mikro-orm-base.repository';
import { User } from '../entities/user.entity';
import { InjectEntityRepository } from '@/database/entity-registry';
import type { IUserRepository } from './user-repository.interface';

@Injectable()
export class UserRepository
  extends MikroOrmBaseRepository<User>
  implements IUserRepository
{
  constructor(
    @InjectEntityRepository(User)
    private readonly userRepo: EntityRepository<User>,
  ) {
    super(userRepo);
  }
}
