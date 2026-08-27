import { DB_CONTEXTS } from '../database.constants';
import { getEntitiesByContext } from '../entity-registry.helper';
import { DatabaseContextDefinition } from '../types/database.types';

export const MAIN_DATABASE_CONTEXT: DatabaseContextDefinition = {
  contextName: DB_CONTEXTS.MAIN,
  entities: getEntitiesByContext(DB_CONTEXTS.MAIN),
  defaultMigrationPath: 'mikro-base/migrations',
  defaultPoolMinSize: 1,
  defaultPoolMaxSize: 10,
  defaultTimezone: '+07:00',
};
