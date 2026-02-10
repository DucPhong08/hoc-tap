import { ConfigService } from '@nestjs/config';
import { MikroOrmModuleOptions } from '@mikro-orm/nestjs';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { MongoDriver } from '@mikro-orm/mongodb';
import { RootConfig } from 'src/config/root.config';
import { MainMigrations } from 'src/modules/database/migrations/main.migrations';

export class MikroOrmConfigService {
  constructor(private readonly configService: ConfigService<RootConfig>) {}

  createMikroOrmOptions(contextName: string = 'main'): MikroOrmModuleOptions {
    const databases = this.configService.get('databases', { infer: true });
    if (!databases) throw new Error('Database config not found');

    const dbConfig = databases[contextName];
    if (!dbConfig)
      throw new Error(`Database config for context ${contextName} not found`);

    const { orm, connection, driverOptions, dev } = dbConfig;
    const {
      database,
      connection: dbType,
      host,
      port,
      user,
      password,
    } = connection;

    // Lấy config chung
    const mode = this.configService.get('mode', { infer: true });
    const timezone = this.configService.get('app.timezone', { infer: true });
    const isProduction = mode === 'production';

    const migrationsRaw = orm?.migrations as any;
    const migrations = migrationsRaw
      ? {
          path: migrationsRaw.path,
          pathTs: migrationsRaw.pathts || migrationsRaw.pathTs,
        }
      : undefined;

    const baseConfig: MikroOrmModuleOptions = {
      registerRequestContext: false,
      allowGlobalContext: true,
      dbName: database,
      debug: !isProduction && (dev?.debug || false),
      migrations: {
        ...migrations,
        migrationsList: MainMigrations,
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

    // Config theo loại database
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

    throw new Error(`Unsupported database connection: ${dbType}`);
  }
}
