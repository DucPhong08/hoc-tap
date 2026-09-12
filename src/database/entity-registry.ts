import { DB_CONTEXTS } from '@/database/database.constants';
import { User } from '@/modules/users/entities/user.entity';
import { Setting } from '@/modules/settings/entities/setting.entity';
import { AuditLog } from '@/modules/audit-logs/entities/audit-log.entity';
import { SessionEntity } from '@/modules/auth/entities/session.entity';
// PLOP: IMPORT_ENTITY
import type { EntityClass, AnyEntity } from '@mikro-orm/core';

export const ENTITY_REGISTRY: Record<string, EntityClass<AnyEntity>[]> = {
  [DB_CONTEXTS.MAIN]: [
    User,
    Setting,
    SessionEntity,
    // PLOP: ADD_MAIN_ENTITY
  ],
  [DB_CONTEXTS.LOGS]: [AuditLog],
};
