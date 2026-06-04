import { DB_CONTEXTS } from 'src/database/database.constants';
import { UserEntity } from '../users/entities/user.entity';
import { SettingEntity } from '../settings/entities/setting.entity';
import { AuditLogEntity } from '../audit-logs/entities/audit-log.entity';
import { EntityClass, AnyEntity } from '@mikro-orm/core';

export const REGISTRY: Record<string, EntityClass<AnyEntity>[]> = {
  [DB_CONTEXTS.MAIN]: [UserEntity, SettingEntity],
  [DB_CONTEXTS.LOGS]: [AuditLogEntity],
};
