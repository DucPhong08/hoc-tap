import { DB_CONTEXTS } from 'src/database/database.constants';
import { User } from '../users/entities/user.entity';
import { Setting } from '../settings/entities/setting.entity';
import { AuditLog } from '../audit-logs/entities/audit-log.entity';
import { EntityClass, AnyEntity } from '@mikro-orm/core';

export const REGISTRY: Record<string, EntityClass<AnyEntity>[]> = {
  [DB_CONTEXTS.MAIN]: [User, Setting],
  [DB_CONTEXTS.LOGS]: [AuditLog],
};
