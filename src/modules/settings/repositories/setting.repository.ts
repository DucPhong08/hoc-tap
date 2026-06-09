import { Injectable } from '@nestjs/common';
import { EntityRepository } from '@mikro-orm/core';
import { MikroOrmBaseRepository } from '../../../infra/repositories/mikro-orm-base.repository';
import { InjectEntityRepository } from 'src/database/entity-registry.helper';
import { Setting } from '../entities/setting.entity';

@Injectable()
export class SettingRepository extends MikroOrmBaseRepository<Setting> {
  constructor(
    @InjectEntityRepository(Setting)
    private readonly settingRepo: EntityRepository<Setting>,
  ) {
    super(settingRepo);
  }
}
