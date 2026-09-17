import { Injectable } from '@nestjs/common';
import { EntityRepository } from '@mikro-orm/core';
import { MikroOrmBaseRepository } from '@/infra/repositories/mikro-orm-base.repository';
import { Setting } from '../entities/setting.entity';
import { InjectEntityRepository } from '@/database/entity-registry';
import type { ISettingRepository } from './setting-repository.interface';

@Injectable()
export class SettingRepository
  extends MikroOrmBaseRepository<Setting>
  implements ISettingRepository
{
  constructor(
    @InjectEntityRepository(Setting)
    private readonly settingRepo: EntityRepository<Setting>,
  ) {
    super(settingRepo);
  }
}
