import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { MikroOrmBaseRepository } from '../../../infra/repositories/mikro-orm-base.repository';
import { DB_CONTEXTS } from 'src/database/database.constants';
import { SettingEntity } from '../entities/setting.entity';
import type { QueryOptions } from '../../../common/interfaces/repository.interface';

@Injectable()
export class SettingRepository extends MikroOrmBaseRepository<
  SettingEntity,
  EntityManager
> {
  constructor(
    @InjectRepository(SettingEntity, DB_CONTEXTS.MAIN)
    repository: EntityRepository<SettingEntity>,
  ) {
    super(repository);
  }

  async findByKey(
    key: string,
    options?: QueryOptions<EntityManager>,
  ): Promise<SettingEntity | null> {
    return this.getOne({ key }, options);
  }
}
