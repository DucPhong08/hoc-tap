import { DB_CONTEXTS } from '@/database/database.constants';
import { User } from '@/modules/users/entities/user.entity';
import { Setting } from '@/modules/settings/entities/setting.entity';
import { AuditLog } from '@/modules/audit-logs/entities/audit-log.entity';
import { Role } from '@/modules/roles/entities/role.entity';
// PLOP: IMPORT_ENTITY
import type { EntityClass, AnyEntity } from '@mikro-orm/core';

export const REGISTRY: Record<string, EntityClass<AnyEntity>[]> = {
  [DB_CONTEXTS.MAIN]: [
    User,
    Setting,
    Role,
    // PLOP: ADD_MAIN_ENTITY
  ],
  [DB_CONTEXTS.LOGS]: [AuditLog],
};
