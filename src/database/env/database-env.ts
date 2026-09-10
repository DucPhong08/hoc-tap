import { Injectable } from '@nestjs/common';
import { Options } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { MongoDriver } from '@mikro-orm/mongodb';
import { DatabaseConfigurationError } from '../errors/database-configuration.error';
import type { DatabaseContextDefinition } from '../database.types';

@Injectable()
export class DatabaseEnvReader {
  buildOptions(def: DatabaseContextDefinition): Options {
    const p = `DB_${def.contextName.toUpperCase()}_`;
    const s = (k: string) => process.env[k]?.trim() || undefined;
    const n = (k: string) => {
      const v = s(k);
      return v ? +v : undefined;
    };
    const b = (k: string) => {
      const v = s(k);
      return v === 'true' ? true : v === 'false' ? false : undefined;
    };

    const isProd = (s('MODE') ?? s('NODE_ENV')) === 'production';
    const driver = this.detectDriver(
      s(`${p}DRIVER`),
      s(`${p}PROFILE`),
      s(`${p}URI`),
      s(`${p}HOST`),
    );

    if (driver === 'postgresql') {
      const poolMin = n(`${p}POOL_MIN`) ?? def.defaultPoolMinSize ?? 2;
      const poolMax = n(`${p}POOL_MAX`) ?? def.defaultPoolMaxSize ?? 10;

      if (poolMin > poolMax) {
        throw new DatabaseConfigurationError(
          `Context "${def.contextName}": poolMin > poolMax.`,
        );
      }

      return {
        driver: PostgreSqlDriver,
        entities: def.entities,
        dbName: s(`${p}DATABASE`) ?? 'mydb',
        host: s(`${p}HOST`) ?? 'localhost',
        port: n(`${p}PORT`) ?? 5432,
        user: s(`${p}USERNAME`),
        password: s(`${p}PASSWORD`),
        schema: s(`${p}SCHEMA`),
        debug: b(`${p}DEBUG`) ?? !isProd,
        allowGlobalContext: true,
        useBatchInserts: true,
        useBatchUpdates: true,
        discovery: { disableDynamicFileAccess: true },
        driverOptions: {
          connection: {
            timezone: s(`${p}TIMEZONE`) ?? def.defaultTimezone ?? '+07:00',
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

    const uri = s(`${p}URI`);
    const parsed = uri ? this.parseMongoUri(def.contextName, uri) : undefined;
    const host = s(`${p}HOST`) ?? parsed?.host ?? 'localhost';
    const port = n(`${p}PORT`) ?? parsed?.port ?? 27017;
    const dbName = s(`${p}DATABASE`) ?? parsed?.databaseName ?? 'test';
    const username = s(`${p}USERNAME`) ?? parsed?.username;
    const password = s(`${p}PASSWORD`) ?? parsed?.password;
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
      debug: b(`${p}DEBUG`) ?? !isProd,
      allowGlobalContext: true,
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
    let p: URL;
    try {
      p = new URL(uri);
    } catch {
      throw new DatabaseConfigurationError(
        `Context "${contextName}": invalid MongoDB URI.`,
      );
    }
    if (p.protocol !== 'mongodb:' && p.protocol !== 'mongodb+srv:') {
      throw new DatabaseConfigurationError(
        `Context "${contextName}": URI must use mongodb://`,
      );
    }
    return {
      normalizedUri: p.toString(),
      host: p.hostname || 'localhost',
      port: p.port ? +p.port : 27017,
      databaseName: p.pathname.replace(/^\/+/, '') || undefined,
      username: p.username ? decodeURIComponent(p.username) : undefined,
      password: p.password ? decodeURIComponent(p.password) : undefined,
    };
  }
}
