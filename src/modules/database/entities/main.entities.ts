import { Type } from '@nestjs/common';
import { UserEntity } from '../../users/entities/user.entity';
import { SettingEntity } from '../../../infra/settings/entities/setting.entity';

export const MainEntities: Type[] = [UserEntity, SettingEntity];
