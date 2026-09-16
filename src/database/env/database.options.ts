import type { Options } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { MongoDriver } from '@mikro-orm/mongodb';
import { bool, isProd, num, required, str } from '@/config/env';
import { DatabaseContext } from '../database.contexts';
import { DatabaseConfigurationError } from '../errors/database-configuration.error';

export function databaseOptions(ctx: DatabaseContext): Options {
  const prefix = `DB_${ctx.name.toUpperCase()}_`;
  const uri = str(`${prefix}URI`);
  const driver = str(`${prefix}DRIVER`)?.toLowerCase();
  const isMongo =
    driver === 'mongo' || driver === 'mongodb' || !!uri?.startsWith('mongodb');

  const shared = {
    entities: ctx.entities,
    debug: bool(`${prefix}DEBUG`) ?? !isProd(),
    discovery: { disableDynamicFileAccess: true },
  };

  if (isMongo) {
    return {
      ...shared,
      driver: MongoDriver,
      clientUrl: isProd()
        ? required(`${prefix}URI`)
        : (uri ?? 'mongodb://localhost:27017/app'),
      dbName: str(`${prefix}DATABASE`),
      driverOptions: {
        minPoolSize: num(`${prefix}POOL_MIN`) ?? ctx.poolMin,
        maxPoolSize: num(`${prefix}POOL_MAX`) ?? ctx.poolMax,
        maxIdleTimeMS: 30_000,
        connectTimeoutMS: 10_000,
      },
    };
  }

  const poolMin = num(`${prefix}POOL_MIN`) ?? ctx.poolMin;
  const poolMax = num(`${prefix}POOL_MAX`) ?? ctx.poolMax;

  if (poolMin > poolMax) {
    throw new DatabaseConfigurationError(
      `Context "${ctx.name}": POOL_MIN (${poolMin}) > POOL_MAX (${poolMax}).`,
    );
  }

  return {
    ...shared,
    driver: PostgreSqlDriver,
    dbName: isProd()
      ? required(`${prefix}DATABASE`)
      : (str(`${prefix}DATABASE`) ?? 'app'),
    host: str(`${prefix}HOST`) ?? 'localhost',
    port: num(`${prefix}PORT`) ?? 5432,
    user: str(`${prefix}USERNAME`),
    password: str(`${prefix}PASSWORD`),
    schema: str(`${prefix}SCHEMA`),
    useBatchInserts: true,
    useBatchUpdates: true,
    driverOptions: {
      connection: { timezone: str(`${prefix}TIMEZONE`) ?? ctx.timezone },
    },
    pool: {
      min: poolMin,
      max: poolMax,
      idleTimeoutMillis: 30_000,
      reapIntervalMillis: 1_000,
      acquireTimeoutMillis: 30_000,
    },
    migrations: { path: ctx.migrationPath, emit: 'js' },
  };
}
