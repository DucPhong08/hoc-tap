/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { MongoDriver } from '@mikro-orm/mongodb';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseConfig } from '../config/root/database.config';

@Module({})
export class OrmModule {
  static register(contextName: string): DynamicModule {
    return {
      module: OrmModule,
      imports: [
        MikroOrmModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (cfg: ConfigService) => {
            const databaseConfig =
              cfg.get<Record<string, DatabaseConfig>>('databases');
            if (databaseConfig == null)
              throw new Error('Database config not found');

            const dbConfig = databaseConfig[contextName];
            if (dbConfig == null) {
              throw new Error(
                `Database config for context ${contextName} is not found`,
              );
            }

            const {
              orm,
              connection: { database, connection, ...conn },
              driverOptions,
            } = dbConfig;

            let driver: typeof PostgreSqlDriver | typeof MongoDriver;
            if (connection === 'postgresql') {
              driver = PostgreSqlDriver;
            } else if (connection === 'mongodb') {
              driver = MongoDriver;
            } else {
              throw new Error(`Unsupported database connection: ${connection}`);
            }

            const baseConfig = {
              driver,
              registerRequestContext: false,
              allowGlobalContext: true,
              dbName: database,
              ...JSON.parse(JSON.stringify({ ...orm, ...conn })),
              driverOptions,
            };

            if (connection === 'mongodb') {
              const { user, password, host, port } = conn;
              const authPart = user && password ? `${user}:${password}@` : '';
              baseConfig['clientUrl'] =
                `mongodb://${authPart}${host}:${port}/${database}`;
              delete baseConfig.user;
              delete baseConfig.password;
              delete baseConfig.host;
              delete baseConfig.port;
            }

            return baseConfig;
          },
          contextName,
        }),
      ],
    };
  }
}
