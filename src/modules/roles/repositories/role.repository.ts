import { Injectable } from '@nestjs/common';
import { EntityRepository } from '@mikro-orm/core';
import { InjectEntityRepository } from '@/database/entity-registry.helper';
import { MikroOrmBaseRepository } from '@/infra/repositories/mikro-orm-base.repository';
import { Role } from '../entities/role.entity';

@Injectable()
export class RoleRepository extends MikroOrmBaseRepository<Role> {
  constructor(
    @InjectEntityRepository(Role)
    roleRepo: EntityRepository<Role>,
  ) {
    super(roleRepo);
  }
}
