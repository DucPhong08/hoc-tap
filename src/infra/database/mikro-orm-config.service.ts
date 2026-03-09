import { ConfigService } from '@nestjs/config';
import type { MikroOrmModuleOptions } from '@mikro-orm/nestjs';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { MongoDriver } from '@mikro-orm/mongodb';
import type { RootConfig } from '../../config/root.config';
import type { DatabaseConfig } from '../../config/root/database.config';
import type { MigrationOrmConfig } from '../../config/root/database/orm/migration.config';
import { DB_CONTEXTS, type DbContext } from '../../modules/database/constants';

export class MikroOrmConfigService {
  constructor(private readonly configService: ConfigService<RootConfig>) {}

  createMikroOrmOptions(
    contextName: DbContext = DB_CONTEXTS.MAIN,
  ): MikroOrmModuleOptions {
    const dbConfig = this.getDatabaseConfig(contextName);
    const { orm, connection, driverOptions, dev } = dbConfig;
    const {
      database,
      connection: dbType,
      host,
      port,
      user,
      password,
    } = connection;

    const mode =
      this.configService.get<RootConfig['mode']>('mode') || 'development';
    const appConfig = this.configService.get<RootConfig['app']>('app');
    const timezone = appConfig?.timezone;
    const isProduction = mode === 'production';
    const migrations = this.normalizeMigrationsConfig(orm?.migrations);

    const baseConfig: MikroOrmModuleOptions = {
      registerRequestContext: false,
      allowGlobalContext: false,
      dbName: database,
      debug: !isProduction && dev.debug,
      ...(migrations ? { migrations } : {}),
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
      return {
        ...baseConfig,
        driver: PostgreSqlDriver,
        host,
        port,
        user,
        password,
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
      const authPart = user && password ? `${user}:${password}@` : '';
      return {
        ...baseConfig,
        driver: MongoDriver,
        clientUrl: `mongodb://${authPart}${host}:${port}/${database}`,
        driverOptions,
      };
    }

    throw new Error('Unsupported database connection');
  }

  private getDatabaseConfig(contextName: DbContext): DatabaseConfig {
    const databases =
      this.configService.get<Record<string, DatabaseConfig>>('databases');

    if (!databases) {
      throw new Error('Database config not found');
    }

    const dbConfig = databases[contextName];
    if (!dbConfig) {
      throw new Error(`Database config for context "${contextName}" not found`);
    }

    return dbConfig;
  }

  private normalizeMigrationsConfig(
    migrations?: MigrationOrmConfig,
  ): MikroOrmModuleOptions['migrations'] | undefined {
    if (!migrations) {
      return undefined;
    }

    return {
      path: migrations.path,
      pathTs: migrations.pathTs,
    };
  }
}
