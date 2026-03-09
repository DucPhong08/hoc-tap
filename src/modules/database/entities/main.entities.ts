import { SettingEntity } from '../../../infra/settings/entities/setting.entity';
import { AuditLogEntity } from '../../audit-logs/entities/audit-log.entity';
import { UserModel } from '../models/user.model';

export const MAIN_ENTITIES = [SettingEntity, AuditLogEntity, UserModel];

export const MainEntities = MAIN_ENTITIES;
