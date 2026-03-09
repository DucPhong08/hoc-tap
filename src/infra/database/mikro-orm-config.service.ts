import { ConfigService } from '@nestjs/config';
import type { MikroOrmModuleOptions } from '@mikro-orm/nestjs';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { MongoDriver } from '@mikro-orm/mongodb';
import type { RootConfig } from '../../config/root.config';
import type { DatabaseConfig } from '../../config/root/database.config';
import { DB_CONTEXTS, type DbContext } from '../../modules/database/constants';

const DEFAULT_MIGRATION_PATH = 'dist/migrations';
const DEFAULT_MIGRATION_PATH_TS = 'src/migrations';
const DEFAULT_MONGO_DB_NAME = 'core';

export class MikroOrmConfigService {
  constructor(private readonly configService: ConfigService<RootConfig>) {}

  createMikroOrmOptions(
    contextName: DbContext = DB_CONTEXTS.MAIN,
    fallbackContextName?: DbContext,
  ): MikroOrmModuleOptions {
    const dbConfig = this.getDatabaseConfig(contextName, fallbackContextName);
    const { connection, driverOptions, dev } = dbConfig;
    if (!connection) {
      throw new Error(
        `Database config for context "${contextName}" is missing connection`,
      );
    }
    const {
      uri,
      database,
      connection: dbType,
      host,
      port,
      user,
      password,
      schema,
    } = connection;

    const mode =
      this.configService.get<RootConfig['mode']>('mode') || 'development';
    const appConfig = this.configService.get<RootConfig['app']>('app');
    const timezone = appConfig?.timezone;
    const isProduction = mode === 'production';

    const baseConfig: MikroOrmModuleOptions = {
      registerRequestContext: false,
      allowGlobalContext: false,
      dbName: database,
      debug: !isProduction && dev.debug,
      migrations: {
        path: DEFAULT_MIGRATION_PATH,
        pathTs: DEFAULT_MIGRATION_PATH_TS,
      },
      discovery: {
        disableDynamicFileAccess: true,
      },
      logger: (message: string) => {
        if (message.includes('[error]')) {
          console.error(message);
        }
      },
    };

    if (dbType === 'postgresql') {
      this.assertPostgresConnectionFields(contextName, host, port, database);

      return {
        ...baseConfig,
        driver: PostgreSqlDriver,
        host,
        port,
        user,
        password,
        ...(schema ? { schema } : {}),
        driverOptions: {
          ...driverOptions,
          connection: { timezone: timezone || '+07:00' },
        },
        pool: { min: 2, max: 10 },
        ...(dev?.autoMigrate &&
          !isProduction && {
            schemaGenerator: {
              disableForeignKeys: false,
              createForeignKeyConstraints: true,
            },
            ensureDatabase: true,
          }),
      };
    }

    if (dbType === 'mongodb') {
      const mongoDbName = database || DEFAULT_MONGO_DB_NAME;
      const authPart = user && password ? `${user}:${password}@` : '';
      const rawClientUrl =
        uri ||
        `mongodb://${authPart}${host || 'localhost'}:${port || 27017}/${mongoDbName}`;
      const clientUrl = this.ensureMongoDatabaseInUri(
        rawClientUrl,
        mongoDbName,
      );

      return {
        ...baseConfig,
        dbName: mongoDbName,
        driver: MongoDriver,
        clientUrl,
        driverOptions,
      };
    }

    throw new Error('Unsupported database connection');
  }

  private getDatabaseConfig(
    contextName: DbContext,
    fallbackContextName?: DbContext,
  ): DatabaseConfig {
    const databases =
      this.configService.get<Record<string, DatabaseConfig>>('databases');

    if (!databases) {
      throw new Error('Database config not found');
    }

    const dbConfig = databases[contextName];
    if (dbConfig) {
      return dbConfig;
    }

    if (fallbackContextName) {
      const fallbackConfig = databases[fallbackContextName];
      if (fallbackConfig) {
        return fallbackConfig;
      }
    }

    throw new Error(`Database config for context "${contextName}" not found`);
  }

  private assertPostgresConnectionFields(
    contextName: DbContext,
    host?: string,
    port?: number,
    database?: string,
  ): void {
    if (!host || port == null || !database) {
      throw new Error(
        `PostgreSQL config for context "${contextName}" requires host, port and database`,
      );
    }
  }

  private ensureMongoDatabaseInUri(uri: string, databaseName: string): string {
    const trimmed = uri.trim();
    if (!trimmed) {
      return trimmed;
    }

    const hashIndex = trimmed.indexOf('#');
    const hash = hashIndex >= 0 ? trimmed.slice(hashIndex) : '';
    const withoutHash = hashIndex >= 0 ? trimmed.slice(0, hashIndex) : trimmed;

    const queryIndex = withoutHash.indexOf('?');
    const query = queryIndex >= 0 ? withoutHash.slice(queryIndex) : '';
    const base =
      queryIndex >= 0 ? withoutHash.slice(0, queryIndex) : withoutHash;

    const schemeIndex = base.indexOf('://');
    if (schemeIndex < 0) {
      return trimmed;
    }

    const prefix = base.slice(0, schemeIndex + 3);
    const authorityAndPath = base.slice(schemeIndex + 3);
    const firstSlashIndex = authorityAndPath.indexOf('/');

    if (firstSlashIndex < 0) {
      return `${base}/${databaseName}${query}${hash}`;
    }

    const authority = authorityAndPath.slice(0, firstSlashIndex);
    const path = authorityAndPath.slice(firstSlashIndex);

    if (/^\/[^/?]+/.test(path)) {
      return trimmed;
    }

    return `${prefix}${authority}/${databaseName}${query}${hash}`;
  }
}
