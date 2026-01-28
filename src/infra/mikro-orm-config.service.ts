import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MikroOrmModuleOptions } from '@mikro-orm/nestjs';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { MongoDriver } from '@mikro-orm/mongodb';
import { RootConfig } from '../config/root.config';

@Injectable()
export class MikroOrmConfigService {
  constructor(private readonly configService: ConfigService<RootConfig>) {}

  createMikroOrmOptions(contextName: string = 'main'): MikroOrmModuleOptions {
    const databases = this.configService.get('databases', { infer: true });

    if (!databases) {
      throw new Error('Database config not found');
    }

    const dbConfig = databases[contextName];

    if (!dbConfig) {
      throw new Error(`Database config for context ${contextName} not found`);
    }

    const {
      orm,
      connection: { database, connection, host, port, user, password },
      driverOptions,
      dev,
    } = dbConfig;

    const mode = this.configService.get('mode', { infer: true });
    const timezone = this.configService.get('app.timezone', { infer: true });
    const isProduction = mode === 'production';

    let driver: typeof PostgreSqlDriver | typeof MongoDriver;
    const baseConfig: MikroOrmModuleOptions = {
      registerRequestContext: false,
      allowGlobalContext: true,
      dbName: database,
      debug: !isProduction && (dev?.debug || false),
      ...orm,
    };

    if (connection === 'postgresql') {
      driver = PostgreSqlDriver;

      Object.assign(baseConfig, {
        driver,
        host,
        port,
        user,
        password,
        driverOptions: {
          ...driverOptions,
          connection: {
            timezone: timezone || '+07:00',
          },
        },
        pool: {
          min: 2,
          max: 10,
        },
      });
    } else if (connection === 'mongodb') {
      driver = MongoDriver;

      const authPart = user && password ? `${user}:${password}@` : '';
      Object.assign(baseConfig, {
        driver,
        clientUrl: `mongodb://${authPart}${host}:${port}/${database}`,
        driverOptions,
      });
    } else {
      throw new Error(`Unsupported database connection: ${connection}`);
    }

    return baseConfig;
  }
}
