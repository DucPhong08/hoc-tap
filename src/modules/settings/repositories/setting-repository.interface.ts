import type { IBaseRepository } from '@/common/interfaces/repository.interface';
import type { Setting } from '../entities/setting.entity';

export interface ISettingRepository<TContext = any> extends IBaseRepository<
  Setting,
  TContext
> {}
