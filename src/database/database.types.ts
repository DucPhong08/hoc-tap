import { AnyEntity, EntityClass } from '@mikro-orm/core';

export interface DatabaseContextDefinition {
  contextName: string;
  entities: EntityClass<AnyEntity>[];
  defaultMigrationPath?: string;
  defaultPoolMinSize?: number;
  defaultPoolMaxSize?: number;
  defaultTimezone?: string;
}
