import { Injectable } from '@nestjs/common';
import { InjectRepository, InjectEntityManager } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { MikroOrmBaseRepository } from '../../../infra/repositories/mikro-orm-base.repository';
import { DB_CONTEXTS } from 'src/database/database.constants';
import { SettingEntity } from '../entities/setting.entity';

@Injectable()
export class SettingRepository extends MikroOrmBaseRepository<SettingEntity> {
  constructor(
    @InjectEntityManager(DB_CONTEXTS.MAIN)
    em: EntityManager,
    @InjectRepository(SettingEntity, DB_CONTEXTS.MAIN)
    repository: EntityRepository<SettingEntity>,
  ) {
    super(em, repository);
  }

  async findByKey(key: string): Promise<SettingEntity | null> {
    return this.getOne({ key });
  }
}
