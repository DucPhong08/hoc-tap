import { AnyEntity, EntityClass } from '@mikro-orm/core';

export type DatabaseDriverName = 'postgresql' | 'mongodb';
export type DatabaseProfileName = 'sql' | 'mongo';
export type ApplicationMode = 'development' | 'production';

export interface DatabaseContextDefinition {
  contextName: string;
  entities: EntityClass<AnyEntity>[];
  defaultMigrationPath?: string;
  defaultPoolMinSize?: number;
  defaultPoolMaxSize?: number;
  defaultTimezone?: string;
}

export interface DatabaseEnvironmentSnapshot {
  contextName: string;
  applicationMode?: string;
  driver?: string;
  profile?: string;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  databaseName?: string;
  schemaName?: string;
  connectionUri?: string;
  debugEnabled?: boolean;
  autoMigrationEnabled?: boolean;
  poolMinSize?: number;
  poolMaxSize?: number;
  timezone?: string;
}

interface BaseResolvedDatabaseSettings {
  contextName: string;
  applicationMode: ApplicationMode;
  driver: DatabaseDriverName;
  databaseName: string;
  debugEnabled: boolean;
}

export interface ResolvedSqlDatabaseSettings extends BaseResolvedDatabaseSettings {
  driver: 'postgresql';
  host: string;
  port: number;
  username?: string;
  password?: string;
  schemaName?: string;
  timezone: string;
  autoMigrationEnabled: boolean;
  migrationPath: string;
  poolMinSize: number;
  poolMaxSize: number;
}

export interface ResolvedMongoDatabaseSettings extends BaseResolvedDatabaseSettings {
  driver: 'mongodb';
  host: string;
  port: number;
  username?: string;
  password?: string;
  connectionUri: string;
}

export type ResolvedDatabaseSettings =
  | ResolvedSqlDatabaseSettings
  | ResolvedMongoDatabaseSettings;

export interface ResolvedDatabaseContext {
  definition: DatabaseContextDefinition;
  settings: ResolvedDatabaseSettings;
}
