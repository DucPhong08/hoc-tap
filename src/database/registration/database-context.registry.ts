import { Injectable } from '@nestjs/common';
import { DB_CONTEXTS } from '../database.constants';
import { getEntitiesByContext } from '../entity-registry.helper';
import { DatabaseConfigurationError } from '../errors/database-configuration.error';
import { DatabaseContextDefinition } from '../database.types';

const CONTEXT_DEFINITIONS: DatabaseContextDefinition[] = [
  {
    contextName: DB_CONTEXTS.MAIN,
    entities: getEntitiesByContext(DB_CONTEXTS.MAIN),
    defaultMigrationPath: 'mikro-base/migrations',
    defaultPoolMinSize: 1,
    defaultPoolMaxSize: 10,
    defaultTimezone: '+07:00',
  },
  {
    contextName: DB_CONTEXTS.LOGS,
    entities: getEntitiesByContext(DB_CONTEXTS.LOGS),
    defaultMigrationPath: 'mikro-logs/migrations',
    defaultPoolMinSize: 1,
    defaultPoolMaxSize: 10,
    defaultTimezone: '+07:00',
  },
];

@Injectable()
export class DatabaseContextRegistry {
  private readonly contexts = new Map<string, DatabaseContextDefinition>(
    CONTEXT_DEFINITIONS.map((def) => [def.contextName, def]),
  );

  get(contextName: string): DatabaseContextDefinition {
    const def = this.contexts.get(contextName);
    if (!def)
      throw new DatabaseConfigurationError(
        `Database context "${contextName}" is not registered.`,
      );
    return def;
  }
}
