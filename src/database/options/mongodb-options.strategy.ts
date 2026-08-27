import { Options } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { MongoDriver } from '@mikro-orm/mongodb';
import { DatabaseDriverOptionsStrategy } from './database-driver-options.strategy';
import {
  DatabaseDriverName,
  ResolvedDatabaseContext,
  ResolvedMongoDatabaseSettings,
} from '../types/database.types';

@Injectable()
export class MongoDbOptionsStrategy implements DatabaseDriverOptionsStrategy {
  supports(driver: DatabaseDriverName): boolean {
    return driver === 'mongodb';
  }

  buildOptions(context: ResolvedDatabaseContext): Options<MongoDriver> {
    const settings = context.settings as ResolvedMongoDatabaseSettings;

    return {
      driver: MongoDriver,
      entities: context.definition.entities,
      dbName: settings.databaseName,
      clientUrl: settings.connectionUri,
      debug: settings.debugEnabled,
      allowGlobalContext: true,
      discovery: {
        disableDynamicFileAccess: true,
      },
      driverOptions: {
        maxPoolSize: 10,
        minPoolSize: 1,
        maxIdleTimeMS: 30000,
        connectTimeoutMS: 10000,
      },
    };
  }
}
