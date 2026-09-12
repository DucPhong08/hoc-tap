import { Injectable } from '@nestjs/common';
import { Options } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { MongoDriver } from '@mikro-orm/mongodb';
import { DatabaseConfigurationError } from '../errors/database-configuration.error';
import type { DatabaseContextDefinition } from '../database.types';

@Injectable()
export class DatabaseEnvReader {
  buildOptions(def: DatabaseContextDefinition): Options {
    const prefix = `DB_${def.contextName.toUpperCase()}_`;
    const getStr = (k: string) => process.env[k]?.trim() || undefined;
    const getNum = (k: string) => {
      const v = getStr(k);
      return v ? +v : undefined;
    };
    const getBool = (k: string) => {
      const v = getStr(k);
      return v === 'true' ? true : v === 'false' ? false : undefined;
    };

    const isProd = (getStr('MODE') ?? getStr('NODE_ENV')) === 'production';
    const driver = this.detectDriver(
      getStr(`${prefix}DRIVER`),
      getStr(`${prefix}PROFILE`),
      getStr(`${prefix}URI`),
      getStr(`${prefix}HOST`),
    );

    if (driver === 'postgresql') {
      const poolMin =
        getNum(`${prefix}POOL_MIN`) ?? def.defaultPoolMinSize ?? 2;
      const poolMax =
        getNum(`${prefix}POOL_MAX`) ?? def.defaultPoolMaxSize ?? 10;

      if (poolMin > poolMax) {
        throw new DatabaseConfigurationError(
          `Context "${def.contextName}": poolMin > poolMax.`,
        );
      }

      return {
        driver: PostgreSqlDriver,
        entities: def.entities,
        dbName: getStr(`${prefix}DATABASE`) ?? 'mydb',
        host: getStr(`${prefix}HOST`) ?? 'localhost',
        port: getNum(`${prefix}PORT`) ?? 5432,
        user: getStr(`${prefix}USERNAME`),
        password: getStr(`${prefix}PASSWORD`),
        schema: getStr(`${prefix}SCHEMA`),
        debug: getBool(`${prefix}DEBUG`) ?? !isProd,
        useBatchInserts: true,
        useBatchUpdates: true,
        discovery: { disableDynamicFileAccess: true },
        driverOptions: {
          connection: {
            timezone:
              getStr(`${prefix}TIMEZONE`) ?? def.defaultTimezone ?? '+07:00',
          },
        },
        pool: {
          min: poolMin,
          max: poolMax,
          idleTimeoutMillis: 30_000,
          reapIntervalMillis: 1_000,
          acquireTimeoutMillis: 30_000,
        },
        migrations: {
          path: def.defaultMigrationPath ?? 'mikro-base/migrations',
          emit: 'js',
        },
      };
    }

    const uri = getStr(`${prefix}URI`);
    const parsed = uri ? this.parseMongoUri(def.contextName, uri) : undefined;
    const host = getStr(`${prefix}HOST`) ?? parsed?.host ?? 'localhost';
    const port = getNum(`${prefix}PORT`) ?? parsed?.port ?? 27017;
    const dbName =
      getStr(`${prefix}DATABASE`) ?? parsed?.databaseName ?? 'test';
    const username = getStr(`${prefix}USERNAME`) ?? parsed?.username;
    const password = getStr(`${prefix}PASSWORD`) ?? parsed?.password;
    const auth =
      username && password
        ? `${encodeURIComponent(username)}:${encodeURIComponent(password)}@`
        : '';

    return {
      driver: MongoDriver,
      entities: def.entities,
      dbName,
      clientUrl:
        parsed?.normalizedUri ?? `mongodb://${auth}${host}:${port}/${dbName}`,
      debug: getBool(`${prefix}DEBUG`) ?? !isProd,
      discovery: { disableDynamicFileAccess: true },
      driverOptions: {
        maxPoolSize: 10,
        minPoolSize: 1,
        maxIdleTimeMS: 30_000,
        connectTimeoutMS: 10_000,
      },
    };
  }

  private detectDriver(
    driver?: string,
    profile?: string,
    uri?: string,
    host?: string,
  ) {
    if (driver) {
      switch (driver.trim().toLowerCase()) {
        case 'postgres':
        case 'postgresql':
          return 'postgresql' as const;
        case 'mongo':
        case 'mongodb':
          return 'mongodb' as const;
        default:
          throw new DatabaseConfigurationError(
            `Unsupported driver "${driver}".`,
          );
      }
    }
    if (profile) {
      switch (profile.trim().toLowerCase()) {
        case 'sql':
          return 'postgresql' as const;
        case 'mongo':
        case 'mongodb':
          return 'mongodb' as const;
        default:
          throw new DatabaseConfigurationError(
            `Unsupported profile "${profile}".`,
          );
      }
    }
    if (uri && host)
      throw new DatabaseConfigurationError(
        'Ambiguous config — set DRIVER explicitly.',
      );
    if (uri) return 'mongodb' as const;
    if (host) return 'postgresql' as const;
    throw new DatabaseConfigurationError('No database configuration found.');
  }

  private parseMongoUri(contextName: string, uri: string) {
    let url: URL;
    try {
      url = new URL(uri);
    } catch {
      throw new DatabaseConfigurationError(
        `Context "${contextName}": invalid MongoDB URI.`,
      );
    }
    if (url.protocol !== 'mongodb:' && url.protocol !== 'mongodb+srv:') {
      throw new DatabaseConfigurationError(
        `Context "${contextName}": URI must use mongodb://`,
      );
    }
    return {
      normalizedUri: url.toString(),
      host: url.hostname || 'localhost',
      port: url.port ? +url.port : 27017,
      databaseName: url.pathname.replace(/^\/+/, '') || undefined,
      username: url.username ? decodeURIComponent(url.username) : undefined,
      password: url.password ? decodeURIComponent(url.password) : undefined,
    };
  }
}
