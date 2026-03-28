import { Options } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { DatabaseDriverOptionsStrategy } from './database-driver-options.strategy';
import {
  DatabaseDriverName,
  ResolvedDatabaseContext,
  ResolvedSqlDatabaseSettings,
} from '../types/database.types';

@Injectable()
export class PostgreSqlOptionsStrategy implements DatabaseDriverOptionsStrategy {
  supports(driver: DatabaseDriverName): boolean {
    return driver === 'postgresql';
  }

  buildOptions(context: ResolvedDatabaseContext): Options<PostgreSqlDriver> {
    const settings = context.settings as ResolvedSqlDatabaseSettings;

    return {
      driver: PostgreSqlDriver,
      entities: [...context.definition.entities],
      dbName: settings.databaseName,
      host: settings.host,
      port: settings.port,
      user: settings.username,
      password: settings.password,
      schema: settings.schemaName,
      debug: settings.debugEnabled,
      allowGlobalContext: true,
      discovery: {
        disableDynamicFileAccess: true,
      },
      driverOptions: {
        connection: {
          timezone: settings.timezone,
        },
      },
      pool: {
        min: settings.poolMinSize,
        max: settings.poolMaxSize,
      },
      migrations: {
        path: settings.migrationPath,
        emit: 'js',
      },
      ...(settings.autoMigrationEnabled &&
      settings.applicationMode !== 'production'
        ? {
            ensureDatabase: true,
            schemaGenerator: {
              disableForeignKeys: false,
              createForeignKeyConstraints: true,
            },
          }
        : {}),
    };
  }
}
