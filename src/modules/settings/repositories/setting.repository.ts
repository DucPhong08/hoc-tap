import { Injectable } from '@nestjs/common';
import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { MikroOrmBaseRepository } from '../../../infra/repositories/mikro-orm-base.repository';
import { InjectEntityRepository } from 'src/database/entity-registry.helper';
import { SettingEntity } from '../entities/setting.entity';
import type { QueryOptions } from '../../../common/interfaces/repository.interface';

@Injectable()
export class SettingRepository extends MikroOrmBaseRepository<
  SettingEntity,
  EntityManager
> {
  constructor(
    @InjectEntityRepository(SettingEntity)
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
