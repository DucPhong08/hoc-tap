import { Injectable } from '@nestjs/common';
import { DatabaseEnvironmentSnapshot } from '../types/database.types';

type DatabaseEnvironmentAliases = {
  applicationMode: string[];
  driver: string[];
  profile: string[];
  host: string[];
  port: string[];
  username: string[];
  password: string[];
  databaseName: string[];
  schemaName: string[];
  connectionUri: string[];
  debugEnabled: string[];
  autoMigrationEnabled: string[];
  migrationPath: string[];
  poolMinSize: string[];
  poolMaxSize: string[];
  timezone: string[];
};

@Injectable()
export class DatabaseEnvironmentReader {
  read(contextName: string): DatabaseEnvironmentSnapshot {
    const aliases = this.buildAliases(contextName);

    return {
      contextName,
      applicationMode: this.readString(aliases.applicationMode),
      driver: this.readString(aliases.driver),
      profile: this.readString(aliases.profile),
      host: this.readString(aliases.host),
      port: this.readInteger(aliases.port),
      username: this.readString(aliases.username),
      password: this.readString(aliases.password),
      databaseName: this.readString(aliases.databaseName),
      schemaName: this.readString(aliases.schemaName),
      connectionUri: this.readString(aliases.connectionUri),
      debugEnabled: this.readBoolean(aliases.debugEnabled),
      autoMigrationEnabled: this.readBoolean(aliases.autoMigrationEnabled),
      poolMinSize: this.readInteger(aliases.poolMinSize),
      poolMaxSize: this.readInteger(aliases.poolMaxSize),
      timezone: this.readString(aliases.timezone),
    };
  }

  private buildAliases(contextName: string): DatabaseEnvironmentAliases {
    const normalizedContextName = contextName.toUpperCase();
    const prefix = `DB_${normalizedContextName}_`;

    return {
      applicationMode: ['MODE', 'NODE_ENV'],
      driver: [`${prefix}DRIVER`],
      profile: [`${prefix}PROFILE`],
      host: [`${prefix}HOST`],
      port: [`${prefix}PORT`],
      username: [`${prefix}USERNAME`],
      password: [`${prefix}PASSWORD`],
      databaseName: [`${prefix}DATABASE`],
      schemaName: [`${prefix}SCHEMA`],
      connectionUri: [`${prefix}URI`],
      debugEnabled: [`${prefix}DEBUG`],
      autoMigrationEnabled: [`${prefix}AUTO_MIGRATE`],
      migrationPath: [`${prefix}MIGRATIONS_PATH`],
      poolMinSize: [`${prefix}POOL_MIN`],
      poolMaxSize: [`${prefix}POOL_MAX`],
      timezone: [`${prefix}TIMEZONE`],
    };
  }

  private readString(keys: string[]): string | undefined {
    for (const key of keys) {
      const trimmed = process.env[key]?.trim();
      if (trimmed) {
        return trimmed;
      }
    }
    return undefined;
  }

  private readInteger(keys: string[]): number | undefined {
    const value = this.readString(keys);
    if (!value) {
      return undefined;
    }

    const parsedValue = Number.parseInt(value, 10);
    return Number.isFinite(parsedValue) ? parsedValue : undefined;
  }

  private readBoolean(keys: string[]): boolean | undefined {
    const value = this.readString(keys)?.toLowerCase();
    return value === 'true' ? true : value === 'false' ? false : undefined;
  }
}
