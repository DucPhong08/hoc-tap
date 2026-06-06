import { defineConfig } from '@mikro-orm/core';
import { MongoDriver } from '@mikro-orm/mongodb';
import { DB_CONTEXTS } from '../database.constants';
import { DatabaseConfigurationError } from '../errors/database-configuration.error';
import { DatabaseOptionsFactory } from '../options/database-options.factory';

// Cho phép truyền context muốn chạy CLI qua biến môi trường (mặc định là 'main')
const contextName = process.env.MIKRO_ORM_CLI_CONTEXT || DB_CONTEXTS.MAIN;
const options = DatabaseOptionsFactory.createStandalone(contextName);

if (options.driver === MongoDriver) {
  throw new DatabaseConfigurationError(
    `MikroORM CLI migrations require an SQL context. Context "${contextName}" is using MongoDB, which is not supported for SQL migrations.`,
  );
}

export default defineConfig(options);
