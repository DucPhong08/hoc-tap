import { Injectable } from '@nestjs/common';
import { DatabaseConfigurationError } from '../errors/database-configuration.error';
import {
  ApplicationMode,
  DatabaseContextDefinition,
  DatabaseDriverName,
  DatabaseEnvironmentSnapshot,
  DatabaseProfileName,
  ResolvedDatabaseSettings,
  ResolvedMongoDatabaseSettings,
  ResolvedSqlDatabaseSettings,
} from '../types/database.types';

@Injectable()
export class DatabaseEnvironmentValidator {
  validate(
    contextDefinition: DatabaseContextDefinition,
    environmentSnapshot: DatabaseEnvironmentSnapshot,
  ): ResolvedDatabaseSettings {
    const applicationMode = this.resolveApplicationMode(
      environmentSnapshot.applicationMode,
    );
    const driver = this.resolveDriver(environmentSnapshot);

    if (driver === 'postgresql') {
      return this.validateSqlSettings(
        contextDefinition,
        environmentSnapshot,
        applicationMode,
      );
    }

    return this.validateMongoSettings(
      contextDefinition,
      environmentSnapshot,
      applicationMode,
    );
  }

  private validateSqlSettings(
    contextDefinition: DatabaseContextDefinition,
    environmentSnapshot: DatabaseEnvironmentSnapshot,
    applicationMode: ApplicationMode,
  ): ResolvedSqlDatabaseSettings {
    const poolMinSize =
      environmentSnapshot.poolMinSize ??
      contextDefinition.defaultPoolMinSize ??
      2;
    const poolMaxSize =
      environmentSnapshot.poolMaxSize ??
      contextDefinition.defaultPoolMaxSize ??
      10;

    if (poolMinSize > poolMaxSize) {
      throw new DatabaseConfigurationError(
        `Database context "${contextDefinition.contextName}" has invalid pool configuration: poolMinSize cannot be greater than poolMaxSize.`,
      );
    }

    return {
      contextName: contextDefinition.contextName,
      applicationMode,
      driver: 'postgresql',
      host: environmentSnapshot.host ?? 'localhost',
      port: environmentSnapshot.port ?? 5432,
      username: environmentSnapshot.username,
      password: environmentSnapshot.password,
      databaseName: environmentSnapshot.databaseName ?? 'mydb',
      schemaName: environmentSnapshot.schemaName,
      debugEnabled:
        environmentSnapshot.debugEnabled ?? applicationMode !== 'production',
      autoMigrationEnabled: environmentSnapshot.autoMigrationEnabled ?? false,
      migrationPath:
        environmentSnapshot.migrationPath ??
        contextDefinition.defaultMigrationPath ??
        'dist/migrations',
      migrationTsPath:
        environmentSnapshot.migrationTsPath ??
        contextDefinition.defaultMigrationTsPath ??
        'src/migrations',
      poolMinSize,
      poolMaxSize,
      timezone:
        environmentSnapshot.timezone ??
        contextDefinition.defaultTimezone ??
        '+07:00',
    };
  }

  private validateMongoSettings(
    contextDefinition: DatabaseContextDefinition,
    environmentSnapshot: DatabaseEnvironmentSnapshot,
    applicationMode: ApplicationMode,
  ): ResolvedMongoDatabaseSettings {
    const parsedConnectionUri = environmentSnapshot.connectionUri
      ? this.parseMongoConnectionUri(
          contextDefinition.contextName,
          environmentSnapshot.connectionUri,
        )
      : undefined;

    const databaseName =
      environmentSnapshot.databaseName ??
      parsedConnectionUri?.databaseName ??
      'test';
    const host =
      environmentSnapshot.host ?? parsedConnectionUri?.host ?? 'localhost';
    const port = environmentSnapshot.port ?? parsedConnectionUri?.port ?? 27017;
    const username =
      environmentSnapshot.username ?? parsedConnectionUri?.username;
    const password =
      environmentSnapshot.password ?? parsedConnectionUri?.password;

    return {
      contextName: contextDefinition.contextName,
      applicationMode,
      driver: 'mongodb',
      databaseName,
      host,
      port,
      username,
      password,
      debugEnabled:
        environmentSnapshot.debugEnabled ?? applicationMode !== 'production',
      connectionUri:
        parsedConnectionUri?.normalizedUri ??
        this.buildMongoConnectionUri({
          host,
          port,
          databaseName,
          username,
          password,
        }),
    };
  }

  private resolveApplicationMode(value?: string): ApplicationMode {
    if (value === 'production') {
      return 'production';
    }

    return 'development';
  }

  private resolveDriver(
    environmentSnapshot: DatabaseEnvironmentSnapshot,
  ): DatabaseDriverName {
    const normalizedDriver = this.normalizeDriver(environmentSnapshot.driver);
    if (normalizedDriver) {
      return normalizedDriver;
    }

    const normalizedProfile = this.normalizeProfile(
      environmentSnapshot.profile,
    );
    if (normalizedProfile === 'mongo') {
      return 'mongodb';
    }

    if (normalizedProfile === 'sql') {
      return 'postgresql';
    }

    const hasMongoShape = Boolean(environmentSnapshot.connectionUri);
    const hasSqlShape = [
      environmentSnapshot.host,
      environmentSnapshot.port,
      environmentSnapshot.username,
      environmentSnapshot.password,
      environmentSnapshot.databaseName,
      environmentSnapshot.schemaName,
    ].some((value) => value !== undefined);

    if (hasMongoShape && hasSqlShape) {
      throw new DatabaseConfigurationError(
        `Database context "${environmentSnapshot.contextName}" is ambiguous. Set DB_${environmentSnapshot.contextName.toUpperCase()}_DRIVER explicitly.`,
      );
    }

    if (hasMongoShape) {
      return 'mongodb';
    }

    if (hasSqlShape) {
      return 'postgresql';
    }

    throw new DatabaseConfigurationError(
      `Database context "${environmentSnapshot.contextName}" has no usable configuration.`,
    );
  }

  private normalizeDriver(value?: string): DatabaseDriverName | undefined {
    if (!value) {
      return undefined;
    }

    const normalizedValue = value.trim().toLowerCase();

    if (normalizedValue === 'postgres' || normalizedValue === 'postgresql') {
      return 'postgresql';
    }

    if (normalizedValue === 'mongo' || normalizedValue === 'mongodb') {
      return 'mongodb';
    }

    throw new DatabaseConfigurationError(
      `Unsupported database driver "${value}".`,
    );
  }

  private normalizeProfile(value?: string): DatabaseProfileName | undefined {
    if (!value) {
      return undefined;
    }

    const normalizedValue = value.trim().toLowerCase();

    if (normalizedValue === 'sql') {
      return 'sql';
    }

    if (normalizedValue === 'mongo' || normalizedValue === 'mongodb') {
      return 'mongo';
    }

    throw new DatabaseConfigurationError(
      `Unsupported database profile "${value}".`,
    );
  }

  private parseMongoConnectionUri(
    contextName: string,
    uri: string,
  ): {
    normalizedUri: string;
    host: string;
    port: number;
    databaseName?: string;
    username?: string;
    password?: string;
  } {
    let parsedUri: URL;

    try {
      parsedUri = new URL(uri);
    } catch {
      throw new DatabaseConfigurationError(
        `Database context "${contextName}" has an invalid MongoDB URI.`,
      );
    }

    if (
      parsedUri.protocol !== 'mongodb:' &&
      parsedUri.protocol !== 'mongodb+srv:'
    ) {
      throw new DatabaseConfigurationError(
        `Database context "${contextName}" must use a MongoDB URI.`,
      );
    }

    const databaseName = parsedUri.pathname.replace(/^\/+/, '') || undefined;

    return {
      normalizedUri: parsedUri.toString(),
      host: parsedUri.hostname || 'localhost',
      port: parsedUri.port ? Number.parseInt(parsedUri.port, 10) : 27017,
      databaseName,
      username: parsedUri.username
        ? decodeURIComponent(parsedUri.username)
        : undefined,
      password: parsedUri.password
        ? decodeURIComponent(parsedUri.password)
        : undefined,
    };
  }

  private buildMongoConnectionUri(params: {
    host: string;
    port: number;
    databaseName: string;
    username?: string;
    password?: string;
  }): string {
    const { host, port, databaseName, username, password } = params;
    const authenticationSegment =
      username && password
        ? `${encodeURIComponent(username)}:${encodeURIComponent(password)}@`
        : '';

    return `mongodb://${authenticationSegment}${host}:${port}/${databaseName}`;
  }
}
