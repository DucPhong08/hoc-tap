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
    const uri = getStr(`${prefix}URI`);
    const driver = getStr(`${prefix}DRIVER`)?.toLowerCase();
    const isMongo =
      driver === 'mongodb' ||
      driver === 'mongo' ||
      (uri?.startsWith('mongodb') ?? false);

    if (isMongo) {
      return {
        driver: MongoDriver,
        entities: def.entities,
        clientUrl: uri ?? 'mongodb://localhost:27017/hoc-tap',
        dbName: getStr(`${prefix}DATABASE`),
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

    const poolMin = getNum(`${prefix}POOL_MIN`) ?? def.defaultPoolMinSize ?? 2;
    const poolMax = getNum(`${prefix}POOL_MAX`) ?? def.defaultPoolMaxSize ?? 10;

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
}
