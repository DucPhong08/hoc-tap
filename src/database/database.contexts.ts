import type { AnyEntity, EntityClass } from '@mikro-orm/core';
import { DB_CONTEXTS, type DbContext } from './database.constants';
import { entitiesOf } from './entity-registry';
import { DatabaseConfigurationError } from './errors/database-configuration.error';

export interface DatabaseContext {
  name: DbContext;
  entities: EntityClass<AnyEntity>[];
  migrationPath: string;
  poolMin: number;
  poolMax: number;
  timezone: string;
}

const DATABASE_CONTEXTS: Record<DbContext, DatabaseContext> = {
  [DB_CONTEXTS.MAIN]: {
    name: DB_CONTEXTS.MAIN,
    entities: entitiesOf(DB_CONTEXTS.MAIN),
    migrationPath: 'mikro-base/migrations',
    poolMin: 1,
    poolMax: 10,
    timezone: '+07:00',
  },
  [DB_CONTEXTS.LOGS]: {
    name: DB_CONTEXTS.LOGS,
    entities: entitiesOf(DB_CONTEXTS.LOGS),
    migrationPath: 'mikro-logs/migrations',
    poolMin: 1,
    poolMax: 10,
    timezone: '+07:00',
  },
};

export const DB_CONTEXT_NAMES = Object.keys(DATABASE_CONTEXTS) as DbContext[];

export function context(name: string): DatabaseContext {
  const found = DATABASE_CONTEXTS[name as DbContext];
  if (!found) {
    throw new DatabaseConfigurationError(
      `Database context "${name}" chưa được đăng ký.`,
    );
  }
  return found;
}
