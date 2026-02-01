import { Type } from '@nestjs/common';
import { UserEntity } from '../../users/entities/user.entity';
import { SettingEntity } from '../../../infra/settings/entities/setting.entity';
import { AuditLogEntity } from 'src/modules/audit-logs/entities/audit-log.entity';

export const MainEntities: Type[] = [UserEntity, SettingEntity, AuditLogEntity];
