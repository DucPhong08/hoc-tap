import { Type } from '@nestjs/common';
import { SettingEntity } from '../../../infra/settings/entities/setting.entity';
import { AuditLogEntity } from 'src/modules/audit-logs/entities/audit-log.entity';
import { UserModel } from '../models/user.model';

const EntityBatBien: Type[] = [SettingEntity, AuditLogEntity];

const Model: Type[] = [UserModel];

export const MainEntities: Type[] = [...EntityBatBien, ...Model];
