import { ConfigService } from '@nestjs/config';
import { MikroOrmModuleOptions } from '@mikro-orm/nestjs';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { MongoDriver } from '@mikro-orm/mongodb';
import { RootConfig } from 'src/config/root.config';
import { MainMigrations } from 'src/modules/database/migrations/main.migrations';

type ResolvedConnectionConfig = {
  connection: 'postgresql' | 'mongodb' | 'mysql';
  host: string;
  port: number;
  database: string;
  user?: string;
  password?: string;
};
type DatabaseProfile = 'sql' | 'mongo';

export class MikroOrmConfigService {
  constructor(private readonly configService: ConfigService<RootConfig>) {}

  createMikroOrmOptions(contextName: string = 'main'): MikroOrmModuleOptions {
    const databases = this.configService.get('databases', { infer: true });
    if (!databases) throw new Error('Database config not found');

    const dbConfig = databases[contextName];
    if (!dbConfig)
      throw new Error(`Database config for context ${contextName} not found`);

    const { orm, dev } = dbConfig;
    const resolvedConfig = this.resolveDatabaseRuntimeConfig(
      contextName,
      dbConfig,
    );
    if (!resolvedConfig) {
      throw new Error(
        `Database connection config for context "${contextName}" not found. ` +
          `Use SQL_* directly for SQL connections, or set BE_DATABASES_${contextName.toUpperCase()}_PROFILE=mongo with DB_URI.`,
      );
    }
    const { connection, driverOptions } = resolvedConfig;
    const {
      database,
      connection: dbType,
      host,
      port,
      user,
      password,
    } = connection;
    const schema =
      typeof driverOptions?.schema === 'string'
        ? driverOptions.schema
        : undefined;
    const clientUrl =
      typeof driverOptions?.clientUrl === 'string'
        ? driverOptions.clientUrl
        : undefined;

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
      const mongoDriverOptions = { ...(driverOptions ?? {}) };
      delete (mongoDriverOptions as { clientUrl?: unknown }).clientUrl;
      return {
        ...baseConfig,
        driver: MongoDriver,
        clientUrl:
          clientUrl ||
          this.buildMongoClientUrl({ host, port, database, user, password }),
        driverOptions: mongoDriverOptions,
      };
    }

    throw new Error(`Unsupported database connection: ${dbType}`);
  }

  private resolveDatabaseRuntimeConfig(
    contextName: string,
    dbConfig: Record<string, any>,
  ): {
    connection: ResolvedConnectionConfig;
    driverOptions?: Record<string, unknown>;
  } | null {
    const directEnvConfig = this.getDirectEnvConnection(contextName, dbConfig);
    const normalizedConnection = this.normalizeConnectionConfig(
      dbConfig?.connection,
    );

    const connection = normalizedConnection ?? directEnvConfig?.connection;
    if (!connection) {
      return null;
    }

    const driverOptions = {
      ...(directEnvConfig?.driverOptions ?? {}),
      ...(dbConfig?.driverOptions ?? {}),
    };

    return { connection, driverOptions };
  }

  private getDirectEnvConnection(
    contextName: string,
    dbConfig?: Record<string, any>,
  ): {
    connection: ResolvedConnectionConfig;
    driverOptions?: Record<string, unknown>;
  } | null {
    const profileFromEnv =
      process.env[`BE_DATABASES_${contextName.toUpperCase()}_PROFILE`];
    const resolvedProfile = this.resolveDatabaseProfilePreference(
      dbConfig?.profile,
      profileFromEnv,
    );

    if (resolvedProfile === 'mongo') {
      return this.getMongoEnvConnection();
    }

    return this.getSqlEnvConnection();
  }

  private getSqlEnvConnection(): {
    connection: ResolvedConnectionConfig;
    driverOptions?: Record<string, unknown>;
  } | null {
    const type = this.normalizeDriver(process.env.SQL_TYPE);
    const host = this.getEnvValue(process.env.SQL_HOST);
    const port = this.getNumberEnvValue(process.env.SQL_PORT);
    const user = this.getEnvValue(process.env.SQL_USER);
    const password = this.getEnvValue(process.env.SQL_PASSWORD);
    const database = this.getEnvValue(process.env.SQL_DB);
    const schema = this.getEnvValue(process.env.SQL_SCHEMA);

    const hasSqlConfig = [
      type,
      host,
      port,
      user,
      password,
      database,
      schema,
    ].some((value) => value !== undefined);

    if (!hasSqlConfig) {
      return null;
    }

    const connectionType = type ?? 'postgresql';
    const connection: ResolvedConnectionConfig = {
      connection: connectionType,
      host: host ?? 'localhost',
      port: port ?? (connectionType === 'mysql' ? 3306 : 5432),
      database: database ?? 'mydb',
    };

    if (user) {
      connection.user = user;
    }

    if (password) {
      connection.password = password;
    }

    return {
      connection,
      ...(schema ? { driverOptions: { schema } } : {}),
    };
  }

  private getMongoEnvConnection(): {
    connection: ResolvedConnectionConfig;
    driverOptions?: Record<string, unknown>;
  } | null {
    const clientUrl = this.getEnvValue(process.env.DB_URI);
    if (!clientUrl) {
      return null;
    }

    try {
      const url = new URL(clientUrl);
      if (!['mongodb:', 'mongodb+srv:'].includes(url.protocol)) {
        return null;
      }

      const connection: ResolvedConnectionConfig = {
        connection: 'mongodb',
        host: url.hostname || 'localhost',
        port: parseInt(url.port || '27017', 10),
        database: url.pathname.replace(/^\/+/, '') || 'test',
      };

      if (url.username) {
        connection.user = decodeURIComponent(url.username);
      }

      if (url.password) {
        connection.password = decodeURIComponent(url.password);
      }

      return {
        connection,
        driverOptions: { clientUrl },
      };
    } catch {
      return null;
    }
  }

  private normalizeConnectionConfig(
    value: Record<string, any> | undefined,
  ): ResolvedConnectionConfig | null {
    if (!value || typeof value !== 'object') {
      return null;
    }

    const dbType = this.normalizeDriver(
      value.connection ?? value.type ?? value.driver,
    );
    const host = this.getEnvValue(value.host);
    const port = this.getNumberEnvValue(value.port);
    const database = this.getEnvValue(value.database ?? value.name ?? value.db);
    const user = this.getEnvValue(value.user);
    const password = this.getEnvValue(value.password);

    if (!dbType || !host || port === undefined || !database) {
      return null;
    }

    return {
      connection: dbType,
      host,
      port,
      database,
      ...(user ? { user } : {}),
      ...(password ? { password } : {}),
    };
  }

  private normalizeDriver(
    value: unknown,
  ): ResolvedConnectionConfig['connection'] | undefined {
    const normalized = this.getEnvValue(value)?.toLowerCase();
    if (!normalized) {
      return undefined;
    }

    if (normalized === 'postgres' || normalized === 'postgresql') {
      return 'postgresql';
    }

    if (normalized === 'mongo' || normalized === 'mongodb') {
      return 'mongodb';
    }

    if (normalized === 'mysql') {
      return 'mysql';
    }

    return undefined;
  }

  private resolveDatabaseProfilePreference(
    profileFromConfig: unknown,
    profileFromEnv: unknown,
  ): DatabaseProfile {
    const normalizedProfileFromEnv =
      this.normalizeDatabaseProfile(profileFromEnv);
    if (normalizedProfileFromEnv) {
      return normalizedProfileFromEnv;
    }

    const normalizedProfileFromConfig =
      this.normalizeDatabaseProfile(profileFromConfig);
    if (normalizedProfileFromConfig) {
      return normalizedProfileFromConfig;
    }

    return 'sql';
  }

  private normalizeDatabaseProfile(
    value: unknown,
  ): DatabaseProfile | undefined {
    const normalized = this.getEnvValue(value)?.toLowerCase();
    if (!normalized) {
      return undefined;
    }

    if (normalized === 'sql') {
      return 'sql';
    }

    if (normalized === 'mongo' || normalized === 'mongodb') {
      return 'mongo';
    }

    return undefined;
  }

  private buildMongoClientUrl(params: {
    host: string;
    port: number;
    database: string;
    user?: string;
    password?: string;
  }): string {
    const { host, port, database, user, password } = params;
    const hasCredentials = Boolean(user && password);
    const authPart = hasCredentials ? `${user}:${password}@` : '';
    return `mongodb://${authPart}${host}:${port}/${database}`;
  }

  private getEnvValue(value: unknown): string | undefined {
    if (typeof value !== 'string') {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  }

  private getNumberEnvValue(value: unknown): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value !== 'string') {
      return undefined;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }

    const parsed = parseInt(trimmed, 10);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
}
