import { DB_CONTEXTS } from '../database.constants';
import { getEntitiesByContext } from '../entity-registry.helper';
import { DatabaseContextDefinition } from '../types/database.types';

export const LOGS_DATABASE_CONTEXT: DatabaseContextDefinition = {
  contextName: DB_CONTEXTS.LOGS,
  entities: getEntitiesByContext(DB_CONTEXTS.LOGS),
  defaultMigrationPath: 'mikro-logs/migrations',
  defaultPoolMinSize: 1,
  defaultPoolMaxSize: 10,
  defaultTimezone: '+07:00',
};
