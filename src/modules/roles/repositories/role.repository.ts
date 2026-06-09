import { Injectable } from '@nestjs/common';
import { EntityRepository } from '@mikro-orm/core';
import { InjectEntityRepository } from 'src/database/entity-registry.helper';
import { MikroOrmBaseRepository } from '../../../infra/repositories/mikro-orm-base.repository';
import { Role } from '../entities/role.entity';

const POPULATION = [];
@Injectable()
export class RoleRepository extends MikroOrmBaseRepository<Role> {
  constructor(
    @InjectEntityRepository(Role)
    private readonly roleRepo: EntityRepository<Role>,
  ) {
    super(roleRepo, {
      populate: {
        getById: POPULATION,
        getOne: POPULATION,
        getMany: POPULATION,
        getPage: POPULATION,
      },
    });
  }
}
