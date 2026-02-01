import { Injectable } from '@nestjs/common';
import { MikroOrmBaseRepository } from '../../repositories/mikro-orm-base.repository';
import { SettingEntity } from '../entities/setting.entity';

@Injectable()
export class SettingRepository extends MikroOrmBaseRepository<SettingEntity> {
  protected entityClass = SettingEntity;

  async findByKey(key: string): Promise<SettingEntity | null> {
    return this.getOne({ key });
  }
}
